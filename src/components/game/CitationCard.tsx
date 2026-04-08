'use client'

import Link from 'next/link'
import { useCitationGame } from '@/hooks/useCitationGame'

const LETTERS = ['A', 'B', 'C', 'D']

export default function CitationCard() {
  const { state, answer } = useCitationGame()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border)', background: 'rgba(3,3,8,0.9)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" className="text-lg font-bold tracking-[0.16em]" style={{ fontFamily: 'var(--font-chakra)' }}>
          <span style={{ color: 'var(--accent)' }}>ANIME</span>
          <span style={{ color: 'var(--text)' }}>DLE</span>
        </Link>
        <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
          ❝ CITATION
        </span>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Loading */}
        {state.status === 'loading' && (
          <div className="py-20 text-center space-y-3">
            <div className="text-3xl font-bold anim-glow" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--accent)' }}>
              LOADING
            </div>
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

        {/* Game */}
        {(state.status === 'playing' || state.status === 'answered') && state.quote && (
          <>
            <p className="text-xs uppercase tracking-[0.22em]"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
              Qui a dit ça ?
            </p>

            {/* Quote block */}
            <div className="relative rounded-2xl p-6 border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {/* Decorative quote mark */}
              <div className="absolute -top-2 left-4 text-[80px] leading-none font-bold select-none pointer-events-none"
                style={{ color: 'var(--accent)', opacity: 0.08, fontFamily: 'var(--font-chakra)' }}>
                ❝
              </div>
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
                background: 'linear-gradient(90deg, var(--accent), var(--violet), transparent)'
              }} />
              <p className="relative text-white text-base leading-relaxed italic pt-2">
                &ldquo;{state.quote.quote_text}&rdquo;
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {state.options.map((option, i) => {
                let borderColor = 'var(--border)'
                let bg = 'var(--card)'
                let textColor = 'var(--text)'
                let opacity = '1'
                let cursor = 'pointer'

                if (state.status === 'answered') {
                  cursor = 'default'
                  if (option.id === state.correctId) {
                    borderColor = '#16a34a'
                    bg = 'rgba(22,163,74,0.12)'
                    textColor = '#86efac'
                  } else if (option.id === state.selectedId) {
                    borderColor = '#dc2626'
                    bg = 'rgba(220,38,38,0.12)'
                    textColor = '#fca5a5'
                  } else {
                    opacity = '0.35'
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => answer(option.id)}
                    disabled={state.status === 'answered'}
                    className="w-full text-left rounded-xl border transition-all duration-200 anim-fade-up"
                    style={{
                      borderColor, background: bg, color: textColor, opacity, cursor,
                      animationDelay: `${i * 0.07}s`,
                      padding: '12px 16px',
                    }}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-chakra)' }}>
                        {LETTERS[i]}
                      </span>
                      <span className="text-sm font-medium">{option.display_name}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Result banner */}
            {state.status === 'answered' && (
              <div className="rounded-xl border p-4 text-center font-bold text-sm anim-slide-in"
                style={{
                  background: state.isCorrect ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                  borderColor: state.isCorrect ? '#16a34a' : '#dc2626',
                  color: state.isCorrect ? '#86efac' : '#fca5a5',
                  fontFamily: 'var(--font-chakra)',
                  letterSpacing: '0.08em',
                }}>
                {state.isCorrect ? '✓ BONNE RÉPONSE !' : '✗ MAUVAISE RÉPONSE'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
