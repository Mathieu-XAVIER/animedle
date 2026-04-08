import AttributeCell from './AttributeCell'
import type { GuessEntry } from '@/hooks/useClassiqueGame'

interface AnimeMap { [id: string]: string }

interface Props {
  entry: GuessEntry
  animeMap: AnimeMap
  index: number
}

const ATTRIBUTES = [
  { key: 'anime_id',   label: 'Anime' },
  { key: 'gender',     label: 'Genre' },
  { key: 'role_type',  label: 'Rôle' },
  { key: 'faction',    label: 'Faction' },
  { key: 'power_type', label: 'Pouvoir' },
  { key: 'weapon_type',label: 'Arme' },
] as const

export default function GuessRow({ entry, animeMap, index }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-white">{entry.character.display_name}</p>
      <div className="flex gap-1.5 flex-wrap">
        {ATTRIBUTES.map((attr, i) => {
          const rawValue = attr.key === 'anime_id'
            ? animeMap[entry.character.anime_id] ?? entry.character.anime_id
            : entry.character[attr.key as keyof typeof entry.character] as string | null

          return (
            <AttributeCell
              key={attr.key}
              label={attr.label}
              value={rawValue}
              result={entry.comparison[attr.key]}
              delay={(index * 6 + i) * 80}
            />
          )
        })}
      </div>
    </div>
  )
}
