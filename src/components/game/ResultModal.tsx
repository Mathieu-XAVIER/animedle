'use client'

import type { GameStatus, GuessEntry } from '@/hooks/useClassiqueGame'
import type { CompareResult } from '@/lib/game/compare'

interface Props {
  status: GameStatus
  attempts: GuessEntry[]
  targetCharacter: { display_name: string; anime_id: string } | null
  animeMap: { [id: string]: string }
  onReplay?: () => void
  mode?: string
  isIllimite?: boolean
}

const EMOJI: Record<CompareResult, string> = {
  correct: '🟩',
  partial:  '🟨',
  wrong:    '⬛',
}

const ATTRS = ['anime_id', 'gender', 'role_type', 'faction', 'power_type', 'weapon_type'] as const

export default function ResultModal({ status, attempts, targetCharacter, animeMap, onReplay, mode = 'Classique', isIllimite }: Props) {
  if (status !== 'won' && status !== 'lost') return null

  function buildShareText() {
    const header = `Animedle — Mode ${mode} (${attempts.length}${isIllimite ? '' : '/6'})`
    const grid = attempts.map(a =>
      ATTRS.map(attr => EMOJI[a.comparison[attr]]).join('')
    ).join('\n')
    return `${header}\n${grid}`
  }

  async function handleShare() {
    const text = buildShareText()
    try {
      await navigator.clipboard.writeText(text)
      alert('Résultat copié !')
    } catch {
      prompt('Copie ce texte :', text)
    }
  }

  const won = status === 'won'

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,8,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl p-6 max-w-sm w-full space-y-4 anim-slide-in"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="text-5xl">{won ? '🎉' : '😔'}</div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--text)' }}>
            {won ? 'Bravo !' : 'Perdu !'}
          </h2>
          {targetCharacter && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              C&apos;était{' '}
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{targetCharacter.display_name}</span>
              {animeMap[targetCharacter.anime_id] && (
                <> · <span style={{ color: 'var(--accent)' }}>{animeMap[targetCharacter.anime_id]}</span></>
              )}
            </p>
          )}
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {won
              ? `${attempts.length} essai${attempts.length > 1 ? 's' : ''}`
              : 'Meilleure chance demain !'}
          </p>
        </div>

        {/* Grille emoji */}
        <div className="font-mono text-lg text-center leading-snug py-1">
          {attempts.map((a, i) => (
            <div key={i}>{ATTRS.map(attr => EMOJI[a.comparison[attr]]).join('')}</div>
          ))}
        </div>

        {/* Séparateur */}
        <div className="h-px" style={{ background: 'var(--border)' }} />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-chakra)', letterSpacing: '0.06em' }}
          >
            PARTAGER
          </button>
          {onReplay && (
            <button
              onClick={onReplay}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-80 active:scale-[0.98] border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)', fontFamily: 'var(--font-chakra)', letterSpacing: '0.06em' }}
            >
              REJOUER
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
