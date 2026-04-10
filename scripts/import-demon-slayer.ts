/**
 * Import Demon Slayer depuis https://demon-slayer-api.onrender.com/v1/
 * Insère directement dans `characters` (is_active=true) + `character_aliases`.
 * Note : hébergé sur Render free tier — peut prendre ~30s à "réveiller"
 *
 * Usage : npx tsx scripts/import-demon-slayer.ts [--no-anilist]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getAniListGender } from './extract-attributes'
import { slugify, normalizeString } from '../src/lib/utils/normalize'

const ANIME_SLUG = 'demon-slayer'
const BASE_URL = 'https://demon-slayer-api.onrender.com/v1/'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) as any

// ─── Types API ────────────────────────────────────────────────────────────────

interface DsCharacter {
  id?: number
  name: string
  age?: string | number | null
  gender?: string | null
  height?: string | null
  weight?: string | null
  race?: string | null
  birthday?: string | null
  hair_color?: string | null
  eye_color?: string | null
  affiliation?: string | null
  occupation?: string | null
  'combat style'?: string | null
  combat_style?: string | null
  status?: string | null
  'manga debut'?: string | null
  'anime debut'?: string | null
  partners?: string | null
  relatives?: string | null
  'japanese va'?: string | null
  japanese_va?: string | null
  'english va'?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStatus(status: string | null | undefined): 'alive' | 'deceased' | 'unknown' {
  if (!status) return 'unknown'
  const lower = status.toLowerCase()
  if (['alive', 'living', 'vivant'].includes(lower)) return 'alive'
  if (['deceased', 'dead', 'mort', 'morte', 'killed'].some(k => lower.includes(k))) return 'deceased'
  return 'unknown'
}

function normalizeGender(gender: string | null | undefined): 'Male' | 'Female' | 'Unknown' | null {
  if (!gender) return null
  const lower = gender.toLowerCase()
  if (lower === 'male') return 'Male'
  if (lower === 'female') return 'Female'
  return 'Unknown'
}

function normalizeAgeRange(age: string | number | null | undefined): 'enfant' | 'adolescent' | 'adulte' | 'ancien' | null {
  if (age === null || age === undefined || age === '') return null
  const match = String(age).match(/(\d+)/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  if (isNaN(n)) return null
  if (n < 15) return 'enfant'
  if (n <= 20) return 'adolescent'
  if (n <= 45) return 'adulte'
  return 'ancien'
}

function getCombatStyle(char: DsCharacter): string | null {
  return char.combat_style ?? char['combat style'] ?? null
}

function buildDescription(char: DsCharacter): string | null {
  const parts: string[] = []
  if (char.occupation) parts.push(char.occupation)
  if (char.affiliation) parts.push(`(${char.affiliation})`)
  if (parts.length === 0) return null
  return parts.join(' ') + '.'
}

function extractPowerType(char: DsCharacter): string | null {
  if (char.race?.toLowerCase().includes('demon') || char.affiliation?.toLowerCase().includes('twelve')) {
    return char.occupation ?? null
  }
  return null
}

async function fetchWithWarmup(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) console.log(`[import-ds] Tentative ${attempt}…`)
      const res = await fetch(url, { signal: AbortSignal.timeout(40000) })
      if (res.ok) return res
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      if (attempt === maxRetries) throw err
      console.log(`[import-ds] API non disponible (${err}), nouvelle tentative dans 10s…`)
      await sleep(10000)
    }
  }
  throw new Error('Toutes les tentatives ont échoué')
}

// ─── Import ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const noAniList = args.includes('--no-anilist')

  // Récupérer l'anime_id
  const { data: anime, error: animeErr } = await supabase
    .from('animes').select('id').eq('slug', ANIME_SLUG).single()
  if (animeErr || !anime) { console.error('[import-ds] Anime introuvable :', animeErr?.message); process.exit(1) }
  const animeId = anime.id

  console.log(`[import-ds] Connexion à ${BASE_URL} (peut prendre ~30s si l'API dort)…`)

  let characters: DsCharacter[]
  try {
    const res = await fetchWithWarmup(BASE_URL)
    characters = await res.json()
  } catch (err) {
    console.error('[import-ds] Erreur API :', err)
    process.exit(1)
  }

  console.log(`[import-ds] ${characters.length} personnages récupérés.`)

  let totalImported = 0
  let totalSkipped = 0
  const errs: string[] = []

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]

    let gender = normalizeGender(char.gender)
    if (!gender && !noAniList) {
      await sleep(800)
      gender = await getAniListGender(char.name)
    }

    process.stdout.write(
      `\r[import-ds] ${i + 1}/${characters.length} — ${char.name.padEnd(30)} | faction: ${(char.affiliation ?? '—').slice(0, 20)}   `
    )

    const externalId = char.id ?? (i + 1)
    const slug = `${slugify(char.name)}-${externalId}`

    const { data: upserted, error: charErr } = await supabase
      .from('characters')
      .upsert({
        anime_id:           animeId,
        slug,
        name:               char.name,
        display_name:       char.name,
        gender,
        role_type:          'supporting',
        faction:            char.affiliation ?? null,
        power_type:         extractPowerType(char),
        weapon_type:        getCombatStyle(char),
        species:            char.race ?? null,
        status:             normalizeStatus(char.status),
        age_range:          normalizeAgeRange(char.age),
        description_short:  buildDescription(char),
        difficulty:         'medium',
        popularity_rank:    null,
        source_external_id: String(externalId),
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

    // Alias
    await supabase.from('character_aliases').delete().eq('character_id', upserted.id)
    await supabase.from('character_aliases').insert({
      character_id:     upserted.id,
      alias:            char.name,
      normalized_alias: normalizeString(char.name),
    })

    totalImported++
  }

  process.stdout.write('\n')
  console.log(`[import-ds] ✓ ${totalImported} insérés/mis à jour, ${totalSkipped} erreurs.` +
    (errs.length ? `\n${errs.slice(0, 5).join('\n')}` : ''))
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(err => { console.error(err); process.exit(1) })
