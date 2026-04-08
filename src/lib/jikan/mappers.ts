import type { JikanCharacterEntry } from './client'
import type { TablesInsert } from '@/types/database'

export function mapJikanEntryToStaging(
  entry: JikanCharacterEntry,
  animeSlug: string
): TablesInsert<'staging_characters'> {
  return {
    anime_slug: animeSlug,
    external_id: entry.character.mal_id,
    name: entry.character.name ?? null,
    name_kanji: entry.character.name_kanji ?? null,
    role_source: entry.role,
    favorites: entry.character.favorites ?? 0,
    image_url: entry.character.images?.jpg?.image_url ?? null,
    raw_json: entry as unknown as TablesInsert<'staging_characters'>['raw_json'],
    validated_at: null,
    validation_status: 'pending',
  }
}
