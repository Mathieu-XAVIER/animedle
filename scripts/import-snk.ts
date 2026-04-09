/**
 * Import Attack on Titan depuis https://api.attackontitanapi.com
 * Fournit des données structurées : faction, genre, espèce, statut, âge
 *
 * Usage : npx tsx scripts/import-snk.ts [--no-anilist]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

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

/** Détermine si un personnage est "Main" basé sur ses rôles et sa faction */
function deriveRoleSource(char: SnkCharacter): string {
  const mainRoleKeywords = ['Commander', 'Captain', 'Special', 'Commanders']
  const isMain = char.roles.some(r => mainRoleKeywords.some(k => r.includes(k)))
  return isMain ? 'Main' : 'Supporting'
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
    if (hasMore) await sleep(300) // politesse
  }

  return all
}

function buildStagingRow(char: SnkCharacter) {
  const extracted = {
    gender:            normalizeGender(char.gender),
    faction:           extractFaction(char),
    power_type:        null as string | null,
    weapon_type:       null as string | null,
    species:           extractSpecies(char),
    status:            normalizeStatus(char.status),
    age_range:         normalizeAgeRange(char.age),
    description_short: buildDescription(char),
  }

  // Si Titan → le type de titan est le "pouvoir"
  if (char.species.some(s => s.toLowerCase().includes('titan'))) {
    const titanRole = char.alias[0] ?? char.roles.find(r => r.includes('Titan')) ?? null
    if (titanRole) extracted.power_type = titanRole
  }

  return {
    anime_slug:        ANIME_SLUG,
    external_id:       char.id,
    name:              char.name,
    name_kanji:        null,
    role_source:       deriveRoleSource(char),
    favorites:         0,
    image_url:         char.img,
    raw_json:          { entry: char, extracted },
    validated_at:      null,
    validation_status: 'pending' as const,
  }
}

async function main() {
  console.log(`[import-snk] Récupération des personnages depuis ${BASE_URL}…`)

  let characters: SnkCharacter[]
  try {
    characters = await fetchAllCharacters()
  } catch (err) {
    console.error('[import-snk] Erreur API :', err)
    process.exit(1)
  }

  console.log(`[import-snk] ${characters.length} personnages récupérés.`)

  const rows = characters.map(buildStagingRow)

  let totalImported = 0
  let totalSkipped = 0
  const errs: string[] = []

  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20)
    const { data, error } = await supabase
      .from('staging_characters')
      .upsert(batch, { onConflict: 'anime_slug,external_id', ignoreDuplicates: true })
      .select('id')

    if (error) {
      console.error(`[import-snk] Erreur Supabase (lot ${i}) :`, error.message)
      errs.push(error.message)
    } else {
      totalImported += data?.length ?? 0
      totalSkipped += batch.length - (data?.length ?? 0)
    }
    process.stdout.write(`\r[import-snk] ${Math.min(i + 20, rows.length)}/${rows.length}…`)
  }

  process.stdout.write('\n')
  console.log(`[import-snk] ✓ ${totalImported} insérés, ${totalSkipped} doublons ignorés.` +
    (errs.length ? ` ${errs.length} erreurs.` : ''))

  // Log dans admin_import_logs
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
