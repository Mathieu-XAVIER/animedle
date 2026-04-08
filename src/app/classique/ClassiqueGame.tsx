'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClassiqueGame } from '@/hooks/useClassiqueGame'
import CharacterSearch from '@/components/game/CharacterSearch'
import GuessRow from '@/components/game/GuessRow'
import ResultModal from '@/components/game/ResultModal'

interface Anime { id: string; title: string; short_title: string | null }

interface Props {
  sessionId: string
  animes: Anime[]
  isIllimite?: boolean
  targetCharacterId?: string
}

const MAX_ATTEMPTS = 6

export default function ClassiqueGame({ sessionId, animes, isIllimite, targetCharacterId }: Props) {
  const router = useRouter()
  const { state, submitGuess } = useClassiqueGame(sessionId, isIllimite ? targetCharacterId : undefined)

  const animeMap = useMemo(
    () => Object.fromEntries(animes.map(a => [a.id, a.short_title ?? a.title])),
    [animes]
  )

  const isActive = state.status === 'playing'
  const excludedIds = state.attempts.map(a => a.character.id)

  const handleReplay = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border)', background: 'rgba(3,3,8,0.9)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" className="text-lg font-bold tracking-[0.16em]" style={{ fontFamily: 'var(--font-chakra)' }}>
          <span style={{ color: 'var(--accent)' }}>ANIME</span>
          <span style={{ color: 'var(--text)' }}>DLE</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
            {isIllimite ? '∞ ILLIMITÉ' : '⚔ CLASSIQUE'}
          </span>
          {/* Dots de tentatives (mode daily uniquement) */}
          {!isIllimite && (
            <div className="flex gap-1">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300" style={{
                  background: i < state.attempts.length
                    ? (state.status === 'won' && i === state.attempts.length - 1 ? '#22c55e' : 'var(--accent)')
                    : 'var(--subtle)',
                }} />
              ))}
            </div>
          )}
          {/* Compteur d'essais (mode illimité) */}
          {isIllimite && state.attempts.length > 0 && (
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
              {state.attempts.length} essai{state.attempts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-5">

        {/* Loading */}
        {state.status === 'loading' && (
          <div className="py-20 text-center space-y-3">
            <div className="text-3xl font-bold anim-glow" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--accent)' }}>
              LOADING
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Connexion au serveur anime...</p>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="rounded-xl border p-4 text-sm" style={{
            borderColor: 'rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.08)', color: '#fca5a5'
          }}>
            {state.error}
          </div>
        )}

        {/* Game UI */}
        {(isActive || state.status === 'won' || state.status === 'lost') && (
          <>
            {/* Title */}
            <div className="flex items-center justify-between">
              <h1 className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--muted)' }}>
                Devine le personnage
              </h1>
              {!isIllimite && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {MAX_ATTEMPTS - state.attempts.length} essai{MAX_ATTEMPTS - state.attempts.length > 1 ? 's' : ''} restant{MAX_ATTEMPTS - state.attempts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Search */}
            <CharacterSearch onSelect={submitGuess} excludeIds={excludedIds} disabled={!isActive} />

            {/* Legend */}
            <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'var(--correct)' }} /> Exact
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'var(--partial)' }} /> Proche
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'var(--wrong)' }} /> Faux
              </span>
            </div>

            {/* Guess grid */}
            <div className="space-y-3">
              {state.attempts.map((entry, i) => (
                <GuessRow key={i} entry={entry} animeMap={animeMap} index={i} />
              ))}
              {/* Placeholder rows (mode daily uniquement) */}
              {!isIllimite && Array.from({ length: Math.max(0, MAX_ATTEMPTS - state.attempts.length) }).map((_, i) => (
                <div key={`ph-${i}`} className="h-16 rounded-xl border-2 border-dashed"
                  style={{ borderColor: 'var(--border)', opacity: Math.max(0.15, 0.45 - i * 0.07) }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Result modal */}
      <ResultModal
        status={state.status}
        attempts={state.attempts}
        targetCharacter={state.targetCharacter}
        animeMap={animeMap}
        mode={isIllimite ? 'Illimité' : 'Classique'}
        isIllimite={isIllimite}
        onReplay={isIllimite ? handleReplay : undefined}
      />
    </div>
  )
}
