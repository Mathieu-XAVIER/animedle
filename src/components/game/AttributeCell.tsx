import type { CompareResult } from '@/lib/game/compare'

interface Props {
  label: string
  value: string | null
  result: CompareResult | 'pending'
  delay?: number
}

const COLORS: Record<string, string> = {
  correct: 'border-green-500 text-white',
  partial:  'border-amber-500 text-white',
  wrong:    'text-[#aaaac8]',
  pending:  'text-[#8888aa]',
}

const ICONS: Record<string, string> = {
  correct: '✓',
  partial:  '~',
  wrong:    '✗',
  pending:  '',
}

export default function AttributeCell({ label, value, result, delay = 0 }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border p-2 min-w-[80px] transition-all duration-300 ${COLORS[result]}`}
      style={{
        animationDelay: `${delay}ms`,
        background: result === 'correct' ? 'var(--correct)' : result === 'partial' ? 'var(--partial)' : result === 'wrong' ? 'var(--wrong)' : 'var(--card)',
        borderColor: result === 'correct' ? '#22c55e' : result === 'partial' ? '#f59e0b' : result === 'wrong' ? 'var(--border)' : 'var(--border)',
      }}
    >
      <span className="text-[10px] uppercase tracking-wider mb-0.5" style={{ opacity: 0.85 }}>{label}</span>
      <span className="text-xs font-semibold text-center leading-tight">{value ?? '—'}</span>
      {result !== 'pending' && (
        <span className="text-[10px] mt-0.5" style={{ opacity: 0.9 }}>{ICONS[result]}</span>
      )}
    </div>
  )
}
