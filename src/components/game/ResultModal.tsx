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
}

const EMOJI: Record<CompareResult, string> = {
  correct: '🟩',
  partial:  '🟨',
  wrong:    '⬛',
}

const ATTRS = ['anime_id', 'gender', 'role_type', 'faction', 'power_type', 'weapon_type'] as const

export default function ResultModal({ status, attempts, targetCharacter, animeMap, onReplay, mode = 'Classique' }: Props) {
  if (status !== 'won' && status !== 'lost') return null

  function buildShareText() {
    const header = `Animedle — Mode ${mode} (${attempts.length}/6)`
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-4xl">{status === 'won' ? '🎉' : '😔'}</p>
          <h2 className="text-xl font-bold text-white">
            {status === 'won' ? 'Bravo !' : 'Perdu !'}
          </h2>
          {targetCharacter && (
            <p className="text-gray-400 text-sm">
              C&apos;était <span className="text-white font-semibold">{targetCharacter.display_name}</span>
              {animeMap[targetCharacter.anime_id] && (
                <> · <span className="text-indigo-400">{animeMap[targetCharacter.anime_id]}</span></>
              )}
            </p>
          )}
          {status === 'won' && (
            <p className="text-gray-400 text-sm">{attempts.length} essai{attempts.length > 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Grille emoji */}
        <div className="font-mono text-lg text-center leading-snug">
          {attempts.map((a, i) => (
            <div key={i}>{ATTRS.map(attr => EMOJI[a.comparison[attr]]).join('')}</div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-sm font-medium"
          >
            Partager
          </button>
          {onReplay && (
            <button
              onClick={onReplay}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-xl text-sm font-medium"
            >
              Rejouer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
