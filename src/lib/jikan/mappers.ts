import type { JikanCharacterEntry, JikanCharacterDetail } from './client'
import type { TablesInsert } from '@/types/database'

export interface ExtractedAttributes {
  gender: 'Male' | 'Female' | 'Unknown' | null
  faction: string | null
  power_type: string | null
  weapon_type: string | null
  description_short: string | null
}

export function mapJikanEntryToStaging(
  entry: JikanCharacterEntry,
  animeSlug: string,
  detail?: JikanCharacterDetail['data'],
  extracted?: ExtractedAttributes
): TablesInsert<'staging_characters'> {
  const imageUrl =
    detail?.images?.jpg?.image_url ??
    entry.character.images?.jpg?.image_url ??
    null

  const rawJson = {
    entry,
    ...(detail
      ? {
          about: detail.about ?? null,
          nicknames: detail.nicknames ?? [],
          anime_appearances: detail.anime ?? [],
        }
      : {}),
    ...(extracted ? { extracted } : {}),
  }

  return {
    anime_slug: animeSlug,
    external_id: entry.character.mal_id,
    name: entry.character.name ?? null,
    name_kanji: entry.character.name_kanji ?? null,
    role_source: entry.role,
    favorites: entry.character.favorites ?? 0,
    image_url: imageUrl,
    raw_json: rawJson as unknown as TablesInsert<'staging_characters'>['raw_json'],
    validated_at: null,
    validation_status: 'pending',
  }
}
