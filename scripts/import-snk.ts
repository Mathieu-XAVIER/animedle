/**
 * Import Attack on Titan depuis https://api.attackontitanapi.com
 * Insère directement dans `characters` (is_active=true) + `character_aliases`.
 *
 * Usage : npx tsx scripts/import-snk.ts [--no-anilist]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { slugify, normalizeString } from '../src/lib/utils/normalize'

const ANIME_SLUG = 'snk'
const BASE_URL = 'https://api.attackontitanapi.com/characters'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) as any

// ─── Types API ────────────────────────────────────────────────────────────────

interface SnkCharacter {
  id: number
  name: string
  img: string | null
  alias: string[]
  species: string[]
  gender: string | null
  age: number | string | null
  height: string | null
  relatives: Array<{ family: string; members: string[] }>
  birthplace: string | null
  residence: string | null
  status: string | null
  occupation: string | null
  groups: Array<{ name: string; sub_groups?: string[] }>
  roles: string[]
  episodes: string[]
}

interface SnkApiResponse {
  info: {
    count: number
    pages: number
    next_page: string | null
    prev_page: string | null
  }
  results: SnkCharacter[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStatus(status: string | null): 'alive' | 'deceased' | 'unknown' {
  if (!status) return 'unknown'
  const lower = status.toLowerCase()
  if (lower === 'alive') return 'alive'
  if (lower === 'deceased') return 'deceased'
  return 'unknown'
}

function normalizeGender(gender: string | null): 'Male' | 'Female' | 'Unknown' | null {
  if (!gender) return null
  const lower = gender.toLowerCase()
  if (lower === 'male') return 'Male'
  if (lower === 'female') return 'Female'
  return 'Unknown'
}

function normalizeAgeRange(age: number | string | null): 'enfant' | 'adolescent' | 'adulte' | 'ancien' | null {
  if (age === null || age === undefined) return null
  const n = typeof age === 'string' ? parseInt(age, 10) : age
  if (isNaN(n)) return null
  if (n < 15) return 'enfant'
  if (n <= 20) return 'adolescent'
  if (n <= 45) return 'adulte'
  return 'ancien'
}

function extractFaction(char: SnkCharacter): string | null {
  if (char.groups && char.groups.length > 0) return char.groups[0].name
  return null
}

function extractSpecies(char: SnkCharacter): string | null {
  if (!char.species || char.species.length === 0) return null
  return char.species[0]
}

function buildDescription(char: SnkCharacter): string | null {
  const parts: string[] = []
  if (char.occupation) parts.push(char.occupation)
  if (char.groups && char.groups.length > 0) parts.push(char.groups[0].name)
  if (char.birthplace) parts.push(`de ${char.birthplace}`)
  if (parts.length === 0) return null
  return parts.join(', ') + '.'
}

function deriveRoleType(char: SnkCharacter): 'main' | 'supporting' {
  const mainRoleKeywords = ['Commander', 'Captain', 'Special', 'Commanders']
  const isMain = char.roles.some(r => mainRoleKeywords.some(k => r.includes(k)))
  return isMain ? 'main' : 'supporting'
}

function extractPowerType(char: SnkCharacter): string | null {
  if (char.species.some(s => s.toLowerCase().includes('titan'))) {
    return char.alias[0] ?? char.roles.find(r => r.includes('Titan')) ?? null
  }
  return null
}

// ─── Import ───────────────────────────────────────────────────────────────────

async function fetchAllCharacters(): Promise<SnkCharacter[]> {
  const all: SnkCharacter[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const res = await fetch(`${BASE_URL}?page=${page}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`HTTP ${res.status} sur la page ${page}`)
    const data: SnkApiResponse = await res.json()
    all.push(...data.results)
    hasMore = data.info.next_page !== null
    page++
    if (hasMore) await sleep(300)
  }

  return all
}

async function main() {
  // Récupérer l'anime_id
  const { data: anime, error: animeErr } = await supabase
    .from('animes').select('id').eq('slug', ANIME_SLUG).single()
  if (animeErr || !anime) { console.error('[import-snk] Anime introuvable :', animeErr?.message); process.exit(1) }
  const animeId = anime.id

  console.log(`[import-snk] Récupération des personnages depuis ${BASE_URL}…`)

  let characters: SnkCharacter[]
  try {
    characters = await fetchAllCharacters()
  } catch (err) {
    console.error('[import-snk] Erreur API :', err)
    process.exit(1)
  }

  console.log(`[import-snk] ${characters.length} personnages récupérés.`)

  let totalImported = 0
  let totalSkipped = 0
  const errs: string[] = []

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]

    process.stdout.write(`\r[import-snk] ${i + 1}/${characters.length} — ${char.name.padEnd(30)}`)

    const slug = `${slugify(char.name)}-${char.id}`

    const { data: upserted, error: charErr } = await supabase
      .from('characters')
      .upsert({
        anime_id:           animeId,
        slug,
        name:               char.name,
        display_name:       char.name,
        gender:             normalizeGender(char.gender),
        role_type:          deriveRoleType(char),
        faction:            extractFaction(char),
        power_type:         extractPowerType(char),
        weapon_type:        null,
        species:            extractSpecies(char),
        status:             normalizeStatus(char.status),
        age_range:          normalizeAgeRange(char.age),
        description_short:  buildDescription(char),
        difficulty:         'medium',
        popularity_rank:    null,
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

    // Alias principal + aliases de l'API
    await supabase.from('character_aliases').delete().eq('character_id', upserted.id)
    const aliases = [char.name, ...char.alias.filter(a => a !== char.name)]
    for (const alias of aliases) {
      await supabase.from('character_aliases').insert({
        character_id:     upserted.id,
        alias,
        normalized_alias: normalizeString(alias),
      })
    }

    totalImported++
  }

  process.stdout.write('\n')
  console.log(`[import-snk] ✓ ${totalImported} insérés/mis à jour, ${totalSkipped} erreurs.` +
    (errs.length ? `\n${errs.slice(0, 5).join('\n')}` : ''))
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(err => { console.error(err); process.exit(1) })
