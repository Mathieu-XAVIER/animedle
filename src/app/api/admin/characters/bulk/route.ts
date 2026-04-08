import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { slugify, normalizeString } from '@/lib/utils/normalize'
import type { TablesInsert } from '@/types/database'

export async function POST(request: NextRequest) {
  const { stagingIds } = await request.json()
  if (!Array.isArray(stagingIds) || stagingIds.length === 0) {
    return NextResponse.json({ error: 'Aucun personnage sélectionné' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Charger les staging + animes en une fois
  const [{ data: stagingList }, { data: animes }] = await Promise.all([
    supabase.from('staging_characters').select('*').in('id', stagingIds),
    supabase.from('animes').select('id, slug'),
  ])

  if (!stagingList?.length) {
    return NextResponse.json({ error: 'Personnages introuvables' }, { status: 404 })
  }

  const animeMap = new Map((animes ?? []).map(a => [a.slug, a.id]))
  const results = { published: 0, skipped: 0, errors: [] as string[] }

  for (const staging of stagingList) {
    const animeId = animeMap.get(staging.anime_slug)
    if (!animeId) {
      results.errors.push(`Anime introuvable pour ${staging.name} (${staging.anime_slug})`)
      results.skipped++
      continue
    }

    const displayName = staging.name ?? 'Inconnu'
    const baseSlug = slugify(displayName)

    // Éviter les slugs en doublon en ajoutant l'external_id si nécessaire
    const slug = `${baseSlug}-${staging.external_id}`

    const characterInsert: TablesInsert<'characters'> = {
      anime_id: animeId,
      slug,
      name: staging.name ?? displayName,
      display_name: displayName,
      gender: null,
      role_type: staging.role_source === 'Main' ? 'main' : 'supporting',
      faction: null,
      power_type: null,
      weapon_type: null,
      difficulty: 'medium',
      popularity_rank: staging.favorites ?? null,
      description_short: null,
      quote_ready: false,
      silhouette_ready: false,
      source_external_id: String(staging.external_id),
      is_active: false,
    }

    const { data: newChar, error: charError } = await supabase
      .from('characters')
      .insert(characterInsert)
      .select('id')
      .single()

    if (charError) {
      results.errors.push(`${displayName} : ${charError.message}`)
      results.skipped++
      continue
    }

    // Alias = le nom d'origine
    await supabase.from('character_aliases').insert({
      character_id: newChar.id,
      alias: displayName,
      normalized_alias: normalizeString(displayName),
    })

    // Marquer staging comme approuvé
    await supabase
      .from('staging_characters')
      .update({ validation_status: 'approved', validated_at: new Date().toISOString() })
      .eq('id', staging.id)

    results.published++
  }

  return NextResponse.json(results)
}
