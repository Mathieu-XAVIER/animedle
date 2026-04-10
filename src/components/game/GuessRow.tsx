import AttributeCell from './AttributeCell'
import type { GuessEntry } from '@/hooks/useClassiqueGame'

interface Props {
  entry: GuessEntry
  index: number
}

function formatBounty(value: number | null): string {
  if (!value || value === 0) return 'Aucune'
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} Md`
  if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(0)} M`
  return `${value.toLocaleString('fr-FR')}`
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// Palette de couleurs stable pour les avatars (basée sur le nom)
function avatarColor(name: string): string {
  const colors = [
    '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
    '#3498db','#9b59b6','#e91e63','#00bcd4','#ff5722',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const ATTRIBUTES = [
  { key: 'gender',          label: 'Genre' },
  { key: 'faction',         label: 'Équipage' },
  { key: 'power_type',      label: 'Fruit du Démon' },
  { key: 'species',         label: 'Espèce' },
  { key: 'status',          label: 'Statut' },
  { key: 'role_type',       label: 'Rôle' },
  { key: 'age_range',       label: 'Âge' },
  { key: 'popularity_rank', label: 'Prime' },
] as const

export default function GuessRow({ entry, index }: Props) {
  const { character, comparison } = entry
  const baseDelay = index * (ATTRIBUTES.length + 1) * 60

  return (
    <div className="flex gap-1.5 items-end flex-wrap">

      {/* Cellule portrait */}
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 min-w-[78px] min-h-[64px] anim-flip-in shrink-0"
        style={{
          background:    avatarColor(character.display_name),
          borderColor:   avatarColor(character.display_name),
          animationDelay: `${baseDelay}ms`,
        }}
      >
        <span className="text-xl font-black text-white leading-none">
          {getInitials(character.display_name)}
        </span>
        <span className="text-[9px] text-white/80 font-semibold mt-0.5 text-center px-1 leading-tight max-w-[72px] truncate">
          {character.display_name}
        </span>
      </div>

      {/* Cellules attributs */}
      {ATTRIBUTES.map((attr, i) => {
        const rawValue = attr.key === 'popularity_rank'
          ? formatBounty(character.popularity_rank)
          : character[attr.key as keyof typeof character] as string | null

        return (
          <AttributeCell
            key={attr.key}
            label={attr.label}
            value={rawValue}
            result={comparison[attr.key]}
            delay={baseDelay + (i + 1) * 60}
          />
        )
      })}
    </div>
  )
}
