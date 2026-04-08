'use client'

import { useState, useEffect } from 'react'
import { getTodayUTC } from '@/lib/utils/dates'

export type CitationStatus = 'loading' | 'playing' | 'answered'

interface Quote { id: string; quote_text: string; character_id: string }
interface Option { id: string; display_name: string }

interface CitationState {
  status: CitationStatus
  challengeId: string | null
  quote: Quote | null
  options: Option[]
  selectedId: string | null
  isCorrect: boolean | null
  correctId: string | null
  error: string | null
}

function getStorageKey() { return `citation_${getTodayUTC()}` }

export function useCitationGame() {
  const [state, setState] = useState<CitationState>({
    status: 'loading',
    challengeId: null,
    quote: null,
    options: [],
    selectedId: null,
    isCorrect: null,
    correctId: null,
    error: null,
  })

  useEffect(() => {
    const saved = (() => {
      try {
        const raw = localStorage.getItem(getStorageKey())
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    })()

    if (saved?.status === 'answered') {
      setState(saved)
    } else {
      load()
    }
  }, [])

  async function load() {
    setState(prev => ({ ...prev, status: 'loading', error: null }))
    const res = await fetch('/api/game/daily?mode=citation')
    if (!res.ok) {
      setState(prev => ({ ...prev, status: 'playing', error: 'Aucun défi citation aujourd\'hui.' }))
      return
    }
    const { challengeId, quote, options } = await res.json()
    setState(prev => ({ ...prev, status: 'playing', challengeId, quote, options, error: null }))
  }

  function answer(selectedId: string) {
    if (state.status !== 'playing' || !state.quote) return

    const correctId = state.quote.character_id
    const isCorrect = selectedId === correctId

    const next: CitationState = { ...state, status: 'answered', selectedId, isCorrect, correctId }
    setState(next)
    try { localStorage.setItem(getStorageKey(), JSON.stringify(next)) } catch { /* ignore */ }
  }

  return { state, answer }
}
