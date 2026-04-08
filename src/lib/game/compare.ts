import type { Tables } from '@/types/database'

export type CompareResult = 'correct' | 'partial' | 'wrong'

export interface GuessComparison {
  anime_id: CompareResult
  gender: CompareResult
  role_type: CompareResult
  faction: CompareResult
  power_type: CompareResult
  weapon_type: CompareResult
}

type Character = Tables<'characters'>

function tokenize(value: string | null): Set<string> {
  if (!value) return new Set()
  return new Set(
    value
      .toLowerCase()
      .split(/[\s,/\-|]+/)
      .map(t => t.trim())
      .filter(t => t.length > 1)
  )
}

function compareField(
  guessVal: string | null,
  targetVal: string | null,
  allowPartial = false
): CompareResult {
  if (!guessVal && !targetVal) return 'correct'
  if (!guessVal || !targetVal) return 'wrong'
  if (guessVal === targetVal) return 'correct'

  if (allowPartial) {
    const guessTokens = tokenize(guessVal)
    const targetTokens = tokenize(targetVal)
    const intersection = [...guessTokens].filter(t => targetTokens.has(t))
    if (intersection.length > 0) return 'partial'
  }

  return 'wrong'
}

export function compareCharacters(
  guess: Character,
  target: Character
): GuessComparison {
  return {
    anime_id: compareField(guess.anime_id, target.anime_id),
    gender: compareField(guess.gender, target.gender),
    role_type: compareField(guess.role_type, target.role_type),
    faction: compareField(guess.faction, target.faction, true),
    power_type: compareField(guess.power_type, target.power_type, true),
    weapon_type: compareField(guess.weapon_type, target.weapon_type, true),
  }
}
