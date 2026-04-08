import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAnimeCharacters } from '@/lib/jikan/client'
import { mapJikanEntryToStaging } from '@/lib/jikan/mappers'
import type { Database } from '@/types/database'
import animesConfig from '../../../../../scripts/animes-config.json'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { animeSlug } = await request.json()

  const animeConf = animesConfig[animeSlug as keyof typeof animesConfig]
  if (!animeConf) {
    return NextResponse.json({ error: `Anime inconnu : ${animeSlug}` }, { status: 400 })
  }

  let entries
  try {
    entries = await getAnimeCharacters(animeConf.malId)
  } catch (err) {
    await supabase.from('admin_import_logs').insert({
      anime_slug: animeSlug,
      imported: 0,
      skipped: 0,
      errors: [String(err)],
      status: 'error',
    })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  const sorted = [...entries].sort((a, b) => (b.character.favorites ?? 0) - (a.character.favorites ?? 0))
  const top = sorted.slice(0, 30)
  const rows = top.map(entry => mapJikanEntryToStaging(entry, animeSlug))

  const { data, error } = await supabase
    .from('staging_characters')
    .upsert(rows, { onConflict: 'anime_slug,external_id', ignoreDuplicates: true })
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const imported = data?.length ?? 0
  const skipped = rows.length - imported

  await supabase.from('admin_import_logs').insert({
    anime_slug: animeSlug,
    imported,
    skipped,
    errors: [],
    status: 'success',
  })

  return NextResponse.json({ imported, skipped })
}
