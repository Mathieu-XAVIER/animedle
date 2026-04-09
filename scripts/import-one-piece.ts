/**
 * Import One Piece depuis https://api.api-onepiece.com/v2/characters/en
 * Fournit : crew (faction), devil fruit (pouvoir), bounty, job, statut
 * Genre : récupéré via AniList (pas disponible dans cette API)
 *
 * Usage : npx tsx scripts/import-one-piece.ts [--no-anilist] [--limit N]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getAniListGender } from './extract-attributes'

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
  // "19 ans" → 19 ou "19" → 19
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

/** Rôle : personnages principaux hardcodés (équipage Chapeau de Paille) */
const MAIN_CREW_ID = 1 // Straw Hat Pirates
function deriveRoleSource(char: OpCharacter): string {
  if (char.crew?.id === MAIN_CREW_ID) return 'Main'
  return 'Supporting'
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

  console.log(`[import-op] Récupération des personnages depuis ${BASE_URL}…`)

  let allChars: OpCharacter[]
  try {
    allChars = await fetchAllCharacters()
  } catch (err) {
    console.error('[import-op] Erreur API :', err)
    process.exit(1)
  }

  console.log(`[import-op] ${allChars.length} personnages disponibles, traitement des ${limit} premiers.`)

  // Trier par bounty (popularité approximative) puis par id
  const sorted = [...allChars].sort((a, b) => {
    const bA = parseInt((a.bounty ?? '0').replace(/\D/g, ''), 10) || 0
    const bB = parseInt((b.bounty ?? '0').replace(/\D/g, ''), 10) || 0
    return bB - bA
  })

  const top = sorted.slice(0, limit)
  const rows = []
  const errs: string[] = []

  for (let i = 0; i < top.length; i++) {
    const char = top[i]

    // Genre via AniList (l'API OP ne le fournit pas)
    let gender: 'Male' | 'Female' | 'Unknown' | null = null
    if (!noAniList) {
      await sleep(800) // rate limit AniList
      gender = await getAniListGender(char.name)
    }

    const extracted = {
      gender,
      faction:           char.crew?.name ?? null,
      power_type:        char.fruit?.name ?? null,
      weapon_type:       null as string | null,
      species:           'humain',
      status:            normalizeStatus(char.status),
      age_range:         normalizeAgeRange(char.age),
      description_short: buildDescription(char),
    }

    process.stdout.write(
      `\r[import-op] ${i + 1}/${top.length} — ${char.name.padEnd(30)} | faction: ${(extracted.faction ?? '—').slice(0, 20)}   `
    )

    rows.push({
      anime_slug:        ANIME_SLUG,
      external_id:       char.id,
      name:              char.name,
      name_kanji:        null,
      role_source:       deriveRoleSource(char),
      favorites:         Math.min(parseInt((char.bounty ?? '0').replace(/\D/g, ''), 10) || 0, 2_000_000_000),
      image_url:         null, // L'API OP ne fournit pas d'images
      raw_json:          { entry: char, extracted },
      validated_at:      null,
      validation_status: 'pending' as const,
    })
  }

  process.stdout.write('\n')

  let totalImported = 0
  let totalSkipped = 0

  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20)
    const { data, error } = await supabase
      .from('staging_characters')
      .upsert(batch, { onConflict: 'anime_slug,external_id', ignoreDuplicates: true })
      .select('id')

    if (error) {
      console.error(`[import-op] Erreur Supabase (lot ${i}) :`, error.message)
      errs.push(error.message)
    } else {
      totalImported += data?.length ?? 0
      totalSkipped += batch.length - (data?.length ?? 0)
    }
  }

  console.log(`[import-op] ✓ ${totalImported} insérés, ${totalSkipped} doublons ignorés.` +
    (errs.length ? ` ${errs.length} erreurs.` : ''))

  await supabase.from('admin_import_logs').insert({
    anime_slug: ANIME_SLUG,
    imported: totalImported,
    skipped: totalSkipped,
    errors: errs,
    status: errs.length > 0 ? 'partial' : 'success',
  })
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(err => { console.error(err); process.exit(1) })
