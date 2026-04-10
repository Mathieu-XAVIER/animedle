'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClassiqueGame } from '@/hooks/useClassiqueGame'
import CharacterSearch from '@/components/game/CharacterSearch'
import GuessRow from '@/components/game/GuessRow'
import ResultModal from '@/components/game/ResultModal'

interface Anime { id: string; slug: string; title: string; short_title: string | null }

interface Props {
  sessionId: string
  animes: Anime[]
  isIllimite?: boolean
  targetCharacterId?: string
  preSelectedAnime?: string
}

export default function ClassiqueGame({ sessionId, animes, isIllimite, targetCharacterId, preSelectedAnime }: Props) {
  const router = useRouter()

  const [selectedAnimeSlug, setSelectedAnimeSlug] = useState<string | null>(
    isIllimite ? null : (preSelectedAnime ?? null)
  )

  const { state, submitGuess, loadDaily } = useClassiqueGame(
    sessionId,
    isIllimite ? targetCharacterId : undefined,
    !isIllimite && selectedAnimeSlug ? selectedAnimeSlug : undefined,
  )

  const animeMap = useMemo(
    () => Object.fromEntries(animes.map(a => [a.id, a.short_title ?? a.title])),
    [animes]
  )

  const isActive = state.status === 'playing'
  const excludedIds = state.attempts.map(a => a.character.id)
  const currentAnimeName = selectedAnimeSlug
    ? (animes.find(a => a.slug === selectedAnimeSlug)?.short_title ?? animes.find(a => a.slug === selectedAnimeSlug)?.title ?? selectedAnimeSlug)
    : null

  const handleReplay = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border)', background: 'rgba(245,244,240,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-base font-bold tracking-[0.16em]" style={{ fontFamily: 'var(--font-chakra)' }}>
            <span style={{ color: 'var(--accent)' }}>ANIME</span>
            <span style={{ color: 'var(--text)' }}>DLE</span>
          </Link>
          {currentAnimeName && (
            <>
              <span style={{ color: 'var(--subtle)' }}>/</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
                {currentAnimeName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
            {isIllimite ? '∞ ILLIMITÉ' : '⚔ CLASSIQUE'}
          </span>
          {state.attempts.length > 0 && (
            <span className="text-xs tabular-nums font-semibold" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
              {state.attempts.length} essai{state.attempts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-5">

        {/* Sélecteur d'anime */}
        {!isIllimite && !selectedAnimeSlug && state.status === 'idle' && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <h1 className="text-sm uppercase tracking-widest font-semibold mb-1"
                style={{ fontFamily: 'var(--font-chakra)', color: 'var(--text)' }}>
                Choisis un univers
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Tu devineras un personnage de cet anime
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {animes.map(anime => (
                <button
                  key={anime.slug}
                  onClick={() => {
                    setSelectedAnimeSlug(anime.slug)
                    loadDaily()
                  }}
                  className="w-full py-4 px-5 rounded-xl border text-left transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--text)' }}>
                    {anime.title}
                  </span>
                  {anime.short_title && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--accent)', background: 'var(--accent-dim)', fontFamily: 'var(--font-chakra)' }}>
                      {anime.short_title}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {state.status === 'loading' && (
          <div className="py-20 text-center space-y-3">
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--accent)' }}>
              Chargement…
            </div>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="rounded-xl border p-4 text-sm" style={{
            borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#b91c1c'
          }}>
            {state.error}
          </div>
        )}

        {/* Game UI */}
        {(isActive || state.status === 'won') && (
          <>
            {/* Titre + légende */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--muted)' }}>
                Devine le personnage
              </h1>
              {/* Légende */}
              <div className="flex gap-3 text-[10px] font-semibold flex-wrap" style={{ color: 'var(--muted)' }}>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded inline-block" style={{ background: 'rgb(61,167,94)' }} />
                  Exact
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded inline-block" style={{ background: 'rgba(217,200,39,0.9)' }} />
                  Proche
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded inline-block" style={{ background: 'rgb(213,54,51)' }} />
                  Incorrect
                </span>
                <span className="flex items-center gap-1 text-red-500 font-bold">↑ Supérieur</span>
                <span className="flex items-center gap-1 text-red-500 font-bold">↓ Inférieur</span>
              </div>
            </div>

            {/* Search */}
            <CharacterSearch
              onSelect={submitGuess}
              excludeIds={excludedIds}
              disabled={!isActive}
              animeSlug={selectedAnimeSlug ?? undefined}
            />

            {/* Grille des tentatives */}
            <div className="space-y-3 overflow-x-auto pb-2">
              {state.attempts.map((entry, i) => (
                <GuessRow key={i} entry={entry} index={i} />
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
