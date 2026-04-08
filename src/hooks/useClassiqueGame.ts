'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodayUTC } from '@/lib/utils/dates'
import type { GuessComparison } from '@/lib/game/compare'

export type GameStatus = 'idle' | 'loading' | 'playing' | 'won' | 'lost'

export interface GuessEntry {
  character: {
    id: string
    display_name: string
    anime_id: string
    gender: string | null
    role_type: string | null
    faction: string | null
    power_type: string | null
    weapon_type: string | null
  }
  comparison: GuessComparison
}

interface GameState {
  status: GameStatus
  challengeId: string | null
  attempts: GuessEntry[]
  targetCharacter: { id: string; display_name: string; anime_id: string } | null
  error: string | null
}

const MAX_ATTEMPTS = 6

function getStorageKey(isIllimite: boolean, challengeId?: string | null) {
  return isIllimite
    ? `illimite_${challengeId ?? 'new'}`
    : `classique_${getTodayUTC()}`
}

function loadFromStorage(key: string): Partial<GameState> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveToStorage(key: string, state: GameState) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* ignore */ }
}

export function useClassiqueGame(sessionId: string, targetCharacterId?: string) {
  const isIllimite = !!targetCharacterId

  const [state, setState] = useState<GameState>({
    status: 'idle',
    challengeId: null,
    attempts: [],
    targetCharacter: null,
    error: null,
  })

  const storageKey = getStorageKey(isIllimite, targetCharacterId)

  useEffect(() => {
    if (isIllimite) {
      // Mode illimité : challengeId = `random-{targetId}`
      const challengeId = `random-${targetCharacterId}`
      const saved = loadFromStorage(getStorageKey(true, challengeId))
      if (saved?.status && saved.status !== 'idle') {
        setState(prev => ({ ...prev, ...saved } as GameState))
      } else {
        setState({ status: 'playing', challengeId, attempts: [], targetCharacter: null, error: null })
      }
    } else {
      const saved = loadFromStorage(storageKey)
      if (saved?.challengeId && saved?.status && saved.status !== 'idle') {
        setState(prev => ({ ...prev, ...saved } as GameState))
      } else {
        loadDaily()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCharacterId])

  const loadDaily = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading', error: null }))
    const res = await fetch('/api/game/daily?mode=classique')
    if (!res.ok) {
      setState(prev => ({ ...prev, status: 'idle', error: 'Aucun défi disponible aujourd\'hui.' }))
      return
    }
    const { challengeId } = await res.json()
    setState(prev => {
      const next = { ...prev, status: 'playing' as GameStatus, challengeId }
      saveToStorage(storageKey, next)
      return next
    })
  }, [storageKey])

  const submitGuess = useCallback(async (characterId: string) => {
    if (state.status !== 'playing' || !state.challengeId) return

    const body = isIllimite
      ? { challengeId: state.challengeId, characterId, sessionId, targetCharacterId }
      : { challengeId: state.challengeId, characterId, sessionId }

    const res = await fetch('/api/game/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return
    const data = await res.json()

    const newEntry: GuessEntry = { character: data.guessCharacter, comparison: data.comparison }

    setState(prev => {
      const attempts = [...prev.attempts, newEntry]
      let status: GameStatus = 'playing'
      if (data.isCorrect) status = 'won'
      else if (!isIllimite && data.attemptsCount >= MAX_ATTEMPTS) status = 'lost'

      const next: GameState = {
        ...prev,
        attempts,
        status,
        targetCharacter: data.targetCharacter ?? prev.targetCharacter,
      }
      saveToStorage(getStorageKey(isIllimite, state.challengeId), next)
      return next
    })
  }, [state.challengeId, state.status, sessionId, isIllimite, targetCharacterId])

  return { state, submitGuess, loadDaily }
}
