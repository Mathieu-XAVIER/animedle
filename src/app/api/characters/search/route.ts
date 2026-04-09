import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeString } from '@/lib/utils/normalize'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const animeSlug = request.nextUrl.searchParams.get('anime')
  const normalized = normalizeString(q)
  const supabase = await createClient()

  // Résoudre l'anime_id si un slug est fourni
  let animeId: string | null = null
  if (animeSlug) {
    const { data: anime } = await supabase.from('animes').select('id').eq('slug', animeSlug).single()
    animeId = anime?.id ?? null
  }

  // Chercher par display_name + via les aliases
  let nameQuery = supabase
    .from('characters')
    .select('id, display_name, anime_id, animes(short_title)')
    .eq('is_active', true)
    .ilike('display_name', `%${q}%`)
    .limit(8)
  if (animeId) nameQuery = nameQuery.eq('anime_id', animeId)

  let aliasQuery = supabase
    .from('character_aliases')
    .select('character_id, characters(id, display_name, anime_id, animes(short_title))')
    .ilike('normalized_alias', `%${normalized}%`)
    .limit(8)
  // Filtrage alias par anime via join imbriqué — pas directement supporté par Supabase PostgREST
  // On filtrera côté application après récupération

  const [{ data: byName }, { data: byAlias }] = await Promise.all([nameQuery, aliasQuery])

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
      // Filtrer par anime côté application si nécessaire
      if (animeId && c.anime_id !== animeId) continue
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
