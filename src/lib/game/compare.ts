import type { Tables } from '@/types/database'

export type CompareResult = 'correct' | 'partial' | 'wrong' | 'higher' | 'lower'

export interface GuessComparison {
  gender:           CompareResult
  role_type:        CompareResult
  faction:          CompareResult
  power_type:       CompareResult
  weapon_type:      CompareResult
  status:           CompareResult
  species:          CompareResult
  age_range:        CompareResult
  popularity_rank:  CompareResult
}

type Character = Tables<'characters'>

// Ordre catégoriel pour age_range
const AGE_ORDER: Record<string, number> = {
  enfant: 0, adolescent: 1, adulte: 2, ancien: 3,
}

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

function compareAgeRange(
  guessVal: string | null,
  targetVal: string | null
): CompareResult {
  if (!guessVal && !targetVal) return 'correct'
  if (!guessVal || !targetVal) return 'wrong'
  if (guessVal === targetVal) return 'correct'

  const guessOrder = AGE_ORDER[guessVal] ?? -1
  const targetOrder = AGE_ORDER[targetVal] ?? -1

  if (guessOrder === -1 || targetOrder === -1) return 'wrong'
  return guessOrder < targetOrder ? 'higher' : 'lower'
}

function compareNumeric(
  guessVal: number | null,
  targetVal: number | null
): CompareResult {
  if (guessVal === null && targetVal === null) return 'correct'
  if (guessVal === null || targetVal === null) return 'wrong'
  if (guessVal === targetVal) return 'correct'
  return guessVal < targetVal ? 'higher' : 'lower'
}

export function compareCharacters(
  guess: Character,
  target: Character
): GuessComparison {
  return {
    gender:          compareField(guess.gender, target.gender),
    role_type:       compareField(guess.role_type, target.role_type),
    faction:         compareField(guess.faction, target.faction, true),
    power_type:      compareField(guess.power_type, target.power_type, true),
    weapon_type:     compareField(guess.weapon_type, target.weapon_type, true),
    status:          compareField(guess.status, target.status),
    species:         compareField(guess.species, target.species, true),
    age_range:       compareAgeRange(guess.age_range, target.age_range),
    popularity_rank: compareNumeric(guess.popularity_rank, target.popularity_rank),
  }
}
