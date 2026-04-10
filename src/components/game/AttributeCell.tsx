import type { CompareResult } from '@/lib/game/compare'

interface Props {
  label: string
  value: string | null
  result: CompareResult | 'pending' | 'identity'
  delay?: number
}

// Couleurs vives style onepiecedle
const STATE_STYLES: Record<string, {
  bg: string; border: string; text: string; icon?: string
}> = {
  correct: {
    bg:     'rgb(61, 167, 94)',
    border: 'rgb(36, 212, 117)',
    text:   'white',
    icon:   '✓',
  },
  partial: {
    bg:     'rgba(217, 200, 39, 0.9)',
    border: 'rgb(243, 224, 51)',
    text:   'rgba(0,0,0,0.85)',
    icon:   '~',
  },
  wrong: {
    bg:     'rgb(213, 54, 51)',
    border: 'rgb(255, 55, 55)',
    text:   'white',
  },
  higher: {
    bg:     'rgb(213, 54, 51)',
    border: 'rgb(255, 55, 55)',
    text:   'white',
  },
  lower: {
    bg:     'rgb(213, 54, 51)',
    border: 'rgb(255, 55, 55)',
    text:   'white',
  },
  pending: {
    bg:     'var(--card)',
    border: 'var(--border)',
    text:   'var(--muted)',
  },
  identity: {
    bg:     'var(--accent)',
    border: 'var(--accent)',
    text:   'white',
  },
}

export default function AttributeCell({ label, value, result, delay = 0 }: Props) {
  const s = STATE_STYLES[result] ?? STATE_STYLES.pending

  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-lg border-2 p-2 min-w-[78px] min-h-[64px] overflow-hidden anim-flip-in"
      style={{
        background:   s.bg,
        borderColor:  s.border,
        color:        s.text,
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="text-[9px] uppercase tracking-wider mb-0.5 opacity-80 font-semibold">{label}</span>
      <span className="text-xs font-bold text-center leading-tight">{value ?? '—'}</span>

      {/* Flèche pour higher / lower */}
      {result === 'higher' && (
        <span className="text-[11px] mt-0.5 font-black leading-none">↑</span>
      )}
      {result === 'lower' && (
        <span className="text-[11px] mt-0.5 font-black leading-none">↓</span>
      )}
      {result === 'correct' && (
        <span className="text-[10px] mt-0.5 font-bold opacity-80">✓</span>
      )}
      {result === 'partial' && (
        <span className="text-[10px] mt-0.5 font-bold opacity-80">~</span>
      )}
    </div>
  )
}
