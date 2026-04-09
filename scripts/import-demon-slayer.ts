/**
 * Import Demon Slayer depuis https://demon-slayer-api.onrender.com/v1/
 * Fournit : affiliation (faction), race/espèce, statut, genre, style de combat
 * Note : hébergé sur Render free tier — peut prendre ~30s à "réveiller"
 *
 * Usage : npx tsx scripts/import-demon-slayer.ts [--no-anilist]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getAniListGender } from './extract-attributes'

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

function getJapaneseVA(char: DsCharacter): string | null {
  return char.japanese_va ?? char['japanese va'] ?? null
}

function buildDescription(char: DsCharacter): string | null {
  const parts: string[] = []
  if (char.occupation) parts.push(char.occupation)
  if (char.affiliation) parts.push(`(${char.affiliation})`)
  if (parts.length === 0) return null
  return parts.join(' ') + '.'
}

/** Réveil de l'API Render : tenter plusieurs fois avec un délai */
async function fetchWithWarmup(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(attempt > 1 ? `[import-ds] Tentative ${attempt}…` : '')
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

  const rows = []
  const errs: string[] = []

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]

    // Genre : depuis l'API en priorité, puis AniList
    let gender = normalizeGender(char.gender)
    if (!gender && !noAniList) {
      await sleep(800)
      gender = await getAniListGender(char.name)
    }

    const combatStyle = getCombatStyle(char)
    const japaneseVA = getJapaneseVA(char)

    const extracted = {
      gender,
      faction:           char.affiliation ?? null,
      power_type:        null as string | null,
      weapon_type:       combatStyle,
      species:           char.race ?? null,
      status:            normalizeStatus(char.status),
      age_range:         normalizeAgeRange(char.age),
      description_short: buildDescription(char),
      voice_actor_jp:    japaneseVA,
    }

    // Pour les démons, le "pouvoir" = leur rang (Upper Rank, Lower Rank, etc.)
    if (char.race?.toLowerCase().includes('demon') || char.affiliation?.toLowerCase().includes('twelve')) {
      extracted.power_type = char.occupation ?? null
    }

    // Index stable : on utilise l'index dans la liste si pas d'id
    const externalId = char.id ?? (i + 1)

    process.stdout.write(
      `\r[import-ds] ${i + 1}/${characters.length} — ${char.name.padEnd(30)} | faction: ${(extracted.faction ?? '—').slice(0, 20)}   `
    )

    rows.push({
      anime_slug:        ANIME_SLUG,
      external_id:       externalId,
      name:              char.name,
      name_kanji:        null,
      role_source:       'Supporting',
      favorites:         0,
      image_url:         null,
      raw_json:          { entry: char, extracted, japanese_va: japaneseVA },
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
      console.error(`[import-ds] Erreur Supabase (lot ${i}) :`, error.message)
      errs.push(error.message)
    } else {
      totalImported += data?.length ?? 0
      totalSkipped += batch.length - (data?.length ?? 0)
    }
  }

  console.log(`[import-ds] ✓ ${totalImported} insérés, ${totalSkipped} doublons ignorés.` +
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
