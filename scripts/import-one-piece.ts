/**
 * Import One Piece depuis https://api.api-onepiece.com/v2/characters/en
 * Insère directement dans `characters` (is_active=true) + `character_aliases`.
 *
 * Usage : npx tsx scripts/import-one-piece.ts [--no-anilist] [--limit N]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getAniListGender } from './extract-attributes'
import { slugify, normalizeString } from '@/lib/utils/normalize'

const ANIME_SLUG = 'one-piece'
const BASE_URL = 'https://api.api-onepiece.com/v2/characters/en'
const DEFAULT_LIMIT = 200

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) as any

// ─── Types API ────────────────────────────────────────────────────────────────

interface OpCrew {
  id: number
  name: string
  roman_name: string | null
  is_yonko: boolean
  status: string | null
}

interface OpFruit {
  id: number
  name: string
  type: string | null
  roman_name: string | null
  filename: string | null
}

interface OpCharacter {
  id: number
  name: string
  size: string | null
  age: string | null
  bounty: string | null
  crew: OpCrew | null
  fruit: OpFruit | null
  job: string | null
  status: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStatus(status: string | null): 'alive' | 'deceased' | 'unknown' {
  if (!status) return 'unknown'
  const lower = status.toLowerCase()
  if (['alive', 'living', 'vivant'].includes(lower)) return 'alive'
  if (['deceased', 'dead', 'mort', 'morte'].includes(lower)) return 'deceased'
  return 'unknown'
}

function normalizeAgeRange(ageStr: string | null): 'enfant' | 'adolescent' | 'adulte' | 'ancien' | null {
  if (!ageStr) return null
  const match = ageStr.match(/(\d+)/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  if (isNaN(n)) return null
  if (n < 15) return 'enfant'
  if (n <= 20) return 'adolescent'
  if (n <= 45) return 'adulte'
  return 'ancien'
}

function buildDescription(char: OpCharacter): string | null {
  const parts: string[] = []
  if (char.job) parts.push(char.job)
  if (char.crew?.name) parts.push(`de ${char.crew.name}`)
  if (parts.length === 0) return null
  return parts.join(' ') + '.'
}

const MAIN_CREW_ID = 1 // Straw Hat Pirates
function deriveRoleType(char: OpCharacter): 'main' | 'supporting' {
  return char.crew?.id === MAIN_CREW_ID ? 'main' : 'supporting'
}

// ─── Import ───────────────────────────────────────────────────────────────────

async function fetchAllCharacters(): Promise<OpCharacter[]> {
  const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<OpCharacter[]>
}

async function main() {
  const args = process.argv.slice(2)
  const noAniList = args.includes('--no-anilist')
  const limitFlag = args.indexOf('--limit')
  const limit = limitFlag !== -1 && args[limitFlag + 1]
    ? parseInt(args[limitFlag + 1], 10)
    : DEFAULT_LIMIT

  // Récupérer l'anime_id
  const { data: anime, error: animeErr } = await supabase
    .from('animes').select('id').eq('slug', ANIME_SLUG).single()
  if (animeErr || !anime) { console.error('[import-op] Anime introuvable :', animeErr?.message); process.exit(1) }
  const animeId = anime.id

  console.log(`[import-op] Récupération des personnages depuis ${BASE_URL}…`)

  let allChars: OpCharacter[]
  try {
    allChars = await fetchAllCharacters()
  } catch (err) {
    console.error('[import-op] Erreur API :', err)
    process.exit(1)
  }

  console.log(`[import-op] ${allChars.length} personnages disponibles, traitement des ${limit} premiers.`)

  const sorted = [...allChars].sort((a, b) => {
    const bA = parseInt((a.bounty ?? '0').replace(/\D/g, ''), 10) || 0
    const bB = parseInt((b.bounty ?? '0').replace(/\D/g, ''), 10) || 0
    return bB - bA
  })

  const top = sorted.slice(0, limit)
  let totalImported = 0
  let totalSkipped = 0
  const errs: string[] = []

  for (let i = 0; i < top.length; i++) {
    const char = top[i]

    let gender: 'Male' | 'Female' | 'Unknown' | null = null
    if (!noAniList) {
      await sleep(800)
      gender = await getAniListGender(char.name)
    }

    process.stdout.write(
      `\r[import-op] ${i + 1}/${top.length} — ${char.name.padEnd(30)} | faction: ${(char.crew?.name ?? '—').slice(0, 20)}   `
    )

    const slug = `${slugify(char.name)}-${char.id}`

    const { data: upserted, error: charErr } = await supabase
      .from('characters')
      .upsert({
        anime_id:           animeId,
        slug,
        name:               char.name,
        display_name:       char.name,
        gender,
        role_type:          deriveRoleType(char),
        faction:            char.crew?.name ?? null,
        power_type:         char.fruit?.name ?? null,
        weapon_type:        null,
        species:            'humain',
        status:             normalizeStatus(char.status),
        age_range:          normalizeAgeRange(char.age),
        description_short:  buildDescription(char),
        difficulty:         'medium',
        popularity_rank:    Math.min(parseInt((char.bounty ?? '0').replace(/\D/g, ''), 10) || 0, 2_000_000_000),
        source_external_id: String(char.id),
        quote_ready:        false,
        silhouette_ready:   false,
        is_active:          true,
      }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (charErr) {
      errs.push(`${char.name} : ${charErr.message}`)
      totalSkipped++
      continue
    }

    // Alias — supprimer les anciens pour éviter les doublons
    await supabase.from('character_aliases').delete().eq('character_id', upserted.id)
    await supabase.from('character_aliases').insert({
      character_id:     upserted.id,
      alias:            char.name,
      normalized_alias: normalizeString(char.name),
    })

    totalImported++
  }

  process.stdout.write('\n')
  console.log(`[import-op] ✓ ${totalImported} insérés/mis à jour, ${totalSkipped} erreurs.` +
    (errs.length ? `\n${errs.slice(0, 5).join('\n')}` : ''))
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(err => { console.error(err); process.exit(1) })
