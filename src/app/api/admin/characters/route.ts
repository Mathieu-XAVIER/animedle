import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils/normalize'
import type { TablesInsert } from '@/types/database'

export async function POST(request: NextRequest) {
  const { stagingId, character, aliases, quotes } = await request.json()
  const supabase = await createAdminClient()

  const slug = slugify(character.display_name)

  // 1. Insérer le personnage
  const characterInsert: TablesInsert<'characters'> = {
    anime_id: character.anime_id,
    slug,
    name: character.name,
    display_name: character.display_name,
    gender: character.gender || null,
    role_type: character.role_type || null,
    faction: character.faction || null,
    power_type: character.power_type || null,
    weapon_type: character.weapon_type || null,
    difficulty: character.difficulty ?? 'medium',
    description_short: character.description_short || null,
    status: character.status || null,
    species: character.species || null,
    age_range: character.age_range || null,
    quote_ready: quotes.length > 0,
    silhouette_ready: false,
    source_external_id: null,
    is_active: false,
  }

  const { data: newChar, error: charError } = await supabase
    .from('characters')
    .insert(characterInsert)
    .select('id')
    .single()

  if (charError) return NextResponse.json({ error: charError.message }, { status: 500 })

  const characterId = newChar.id

  // 2. Insérer les aliases
  if (aliases.length > 0) {
    const { error: aliasError } = await supabase
      .from('character_aliases')
      .insert(aliases.map((a: { alias: string; normalized_alias: string }) => ({
        character_id: characterId,
        alias: a.alias,
        normalized_alias: a.normalized_alias,
      })))
    if (aliasError) return NextResponse.json({ error: aliasError.message }, { status: 500 })
  }

  // 3. Insérer les citations
  if (quotes.length > 0) {
    const { error: quoteError } = await supabase
      .from('quotes')
      .insert(quotes.map((q: { quote_text: string; language: string; is_spoiler: boolean }) => ({
        character_id: characterId,
        quote_text: q.quote_text,
        language: q.language,
        is_spoiler: q.is_spoiler,
        is_active: true,
      })))
    if (quoteError) return NextResponse.json({ error: quoteError.message }, { status: 500 })
  }

  // 4. Marquer le staging comme approuvé
  await supabase
    .from('staging_characters')
    .update({ validation_status: 'approved', validated_at: new Date().toISOString() })
    .eq('id', stagingId)

  return NextResponse.json({ id: characterId })
}
