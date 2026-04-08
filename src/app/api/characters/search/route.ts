import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeString } from '@/lib/utils/normalize'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const normalized = normalizeString(q)
  const supabase = await createClient()

  // Chercher par display_name + via les aliases
  const [{ data: byName }, { data: byAlias }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, display_name, anime_id, animes(short_title)')
      .eq('is_active', true)
      .ilike('display_name', `%${q}%`)
      .limit(8),
    supabase
      .from('character_aliases')
      .select('character_id, characters(id, display_name, anime_id, animes(short_title))')
      .ilike('normalized_alias', `%${normalized}%`)
      .limit(8),
  ])

  // Fusionner et dédupliquer
  const seen = new Set<string>()
  const results: { id: string; display_name: string; anime_id: string; short_title: string | null }[] = []

  for (const c of byName ?? []) {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      results.push({
        id: c.id,
        display_name: c.display_name,
        anime_id: c.anime_id,
        short_title: (c.animes as { short_title: string | null } | null)?.short_title ?? null,
      })
    }
  }

  for (const a of byAlias ?? []) {
    const c = a.characters as { id: string; display_name: string; anime_id: string; animes: { short_title: string | null } | null } | null
    if (c && !seen.has(c.id)) {
      seen.add(c.id)
      results.push({
        id: c.id,
        display_name: c.display_name,
        anime_id: c.anime_id,
        short_title: c.animes?.short_title ?? null,
      })
    }
  }

  return NextResponse.json(results.slice(0, 10))
}
