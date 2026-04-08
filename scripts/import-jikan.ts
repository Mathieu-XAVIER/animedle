/**
 * Script d'import Jikan → staging_characters
 * Usage : npx tsx scripts/import-jikan.ts --anime one-piece
 *         npx tsx scripts/import-jikan.ts --all
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getAnimeCharacters } from '../src/lib/jikan/client'
import { mapJikanEntryToStaging } from '../src/lib/jikan/mappers'
import animesConfig from './animes-config.json'

// Pas de générique Database ici : les types seront générés depuis Supabase CLI
// une fois le projet créé. Les assertions permettent d'éviter les erreurs TS.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) as any

async function importAnime(slug: string) {
  const animeConf = animesConfig[slug as keyof typeof animesConfig]
  if (!animeConf) {
    console.error(`[import] Anime inconnu : "${slug}". Slugs disponibles : ${Object.keys(animesConfig).join(', ')}`)
    process.exit(1)
  }

  console.log(`[import] Démarrage import de "${animeConf.title}" (MAL ID: ${animeConf.malId})...`)

  let entries
  try {
    entries = await getAnimeCharacters(animeConf.malId)
  } catch (err) {
    console.error(`[import] Erreur lors de la récupération Jikan :`, err)
    await logImport(slug, 0, 0, [String(err)], 'error')
    return
  }

  console.log(`[import] ${entries.length} personnages récupérés depuis Jikan.`)

  // Trier par popularité et garder les 30 premiers
  const sorted = [...entries].sort((a, b) => (b.character.favorites ?? 0) - (a.character.favorites ?? 0))
  const top = sorted.slice(0, 30)

  const rows = top.map(entry => mapJikanEntryToStaging(entry, slug))

  const { data, error } = await supabase
    .from('staging_characters')
    .upsert(rows, { onConflict: 'anime_slug,external_id', ignoreDuplicates: true })
    .select('id')

  if (error) {
    console.error(`[import] Erreur Supabase :`, error.message)
    await logImport(slug, 0, 0, [error.message], 'error')
    return
  }

  const imported = data?.length ?? 0
  const skipped = rows.length - imported
  console.log(`[import] ✓ ${imported} insérés, ${skipped} doublons ignorés.`)
  await logImport(slug, imported, skipped, [], 'success')
}

async function logImport(
  animeSlug: string,
  imported: number,
  skipped: number,
  errors: string[],
  status: string
) {
  await supabase.from('admin_import_logs').insert({
    anime_slug: animeSlug,
    imported,
    skipped,
    errors,
    status,
  })
}

async function main() {
  const args = process.argv.slice(2)
  const animeFlag = args.indexOf('--anime')
  const allFlag = args.includes('--all')

  if (allFlag) {
    for (const slug of Object.keys(animesConfig)) {
      await importAnime(slug)
    }
    return
  }

  if (animeFlag === -1 || !args[animeFlag + 1]) {
    console.error('Usage : npx tsx scripts/import-jikan.ts --anime <slug>')
    console.error('        npx tsx scripts/import-jikan.ts --all')
    process.exit(1)
  }

  await importAnime(args[animeFlag + 1])
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
