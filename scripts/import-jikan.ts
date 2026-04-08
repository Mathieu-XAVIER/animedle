/**
 * Script d'import Jikan → staging_characters
 * Usage : npx tsx scripts/import-jikan.ts --anime one-piece
 *         npx tsx scripts/import-jikan.ts --all
 *         npx tsx scripts/import-jikan.ts --anime one-piece --limit 80
 *         npx tsx scripts/import-jikan.ts --anime one-piece --no-details
 *         npx tsx scripts/import-jikan.ts --anime one-piece --no-anilist  (skip AniList gender lookup)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getAnimeCharacters, getCharacterDetail } from '../src/lib/jikan/client'
import { mapJikanEntryToStaging } from '../src/lib/jikan/mappers'
import { extractAttributes } from './extract-attributes'
import animesConfig from './animes-config.json'

const DEFAULT_LIMIT = 100

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) as any

async function importAnime(slug: string, limit: number, withDetails: boolean, withAniList: boolean) {
  const animeConf = animesConfig[slug as keyof typeof animesConfig]
  if (!animeConf) {
    console.error(`[import] Anime inconnu : "${slug}". Slugs disponibles : ${Object.keys(animesConfig).join(', ')}`)
    process.exit(1)
  }

  console.log(`[import] "${animeConf.title}" — limit: ${limit}, détails: ${withDetails}, AniList: ${withAniList}`)

  let entries
  try {
    entries = await getAnimeCharacters(animeConf.malId)
  } catch (err) {
    console.error(`[import] Erreur Jikan :`, err)
    await logImport(slug, 0, 0, [String(err)], 'error')
    return
  }

  console.log(`[import] ${entries.length} personnages récupérés depuis Jikan.`)

  const sorted = [...entries].sort((a, b) => (b.character.favorites ?? 0) - (a.character.favorites ?? 0))
  const top = sorted.slice(0, limit)

  const rows = []
  const errs: string[] = []

  for (let i = 0; i < top.length; i++) {
    const entry = top[i]
    const charId = entry.character.mal_id
    let detail: Awaited<ReturnType<typeof getCharacterDetail>>['data'] | undefined

    // 1. Récupérer les détails Jikan (about, nicknames…)
    if (withDetails) {
      try {
        const res = await getCharacterDetail(charId)
        detail = res.data
      } catch (err) {
        errs.push(`Détail ignoré pour ${entry.character.name} : ${String(err)}`)
      }
    }

    // 2. Extraire les attributs (regex + optionnel AniList)
    const about = detail?.about ?? ''
    const extracted = await extractAttributes(entry.character.name, about, withAniList)

    process.stdout.write(
      `\r[import] ${i + 1}/${top.length} — ${entry.character.name.padEnd(30)} | genre: ${extracted.gender ?? '?'} | faction: ${(extracted.faction ?? '—').slice(0, 20)}   `
    )

    rows.push(mapJikanEntryToStaging(entry, slug, detail, extracted))
  }

  process.stdout.write('\n')

  // Upsert par lots de 20
  let totalImported = 0
  let totalSkipped = 0
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20)
    const { data, error } = await supabase
      .from('staging_characters')
      .upsert(batch, { onConflict: 'anime_slug,external_id', ignoreDuplicates: true })
      .select('id')

    if (error) {
      console.error(`[import] Erreur Supabase (lot ${i}) :`, error.message)
      errs.push(error.message)
    } else {
      totalImported += data?.length ?? 0
      totalSkipped += batch.length - (data?.length ?? 0)
    }
  }

  console.log(
    `[import] ✓ ${totalImported} insérés, ${totalSkipped} doublons ignorés.` +
    (errs.length ? ` ${errs.length} avertissements.` : '')
  )
  await logImport(slug, totalImported, totalSkipped, errs, errs.length > 0 ? 'partial' : 'success')
}

async function logImport(animeSlug: string, imported: number, skipped: number, errors: string[], status: string) {
  await supabase.from('admin_import_logs').insert({ anime_slug: animeSlug, imported, skipped, errors, status })
}

async function main() {
  const args = process.argv.slice(2)
  const animeFlag  = args.indexOf('--anime')
  const allFlag    = args.includes('--all')
  const noDetails  = args.includes('--no-details')
  const noAniList  = args.includes('--no-anilist')
  const withDetails  = !noDetails
  const withAniList  = !noAniList

  const limitFlag = args.indexOf('--limit')
  const limit = limitFlag !== -1 && args[limitFlag + 1] ? parseInt(args[limitFlag + 1], 10) : DEFAULT_LIMIT

  if (isNaN(limit) || limit < 1) {
    console.error('[import] --limit doit être un entier positif.')
    process.exit(1)
  }

  if (allFlag) {
    for (const slug of Object.keys(animesConfig)) {
      await importAnime(slug, limit, withDetails, withAniList)
    }
    return
  }

  if (animeFlag === -1 || !args[animeFlag + 1]) {
    console.error('Usage : npx tsx scripts/import-jikan.ts --anime <slug> [--limit N] [--no-details] [--no-anilist]')
    console.error('        npx tsx scripts/import-jikan.ts --all [--limit N] [--no-anilist]')
    process.exit(1)
  }

  await importAnime(args[animeFlag + 1], limit, withDetails, withAniList)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
