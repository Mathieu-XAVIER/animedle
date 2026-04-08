import type { CompareResult } from '@/lib/game/compare'

interface Props {
  label: string
  value: string | null
  result: CompareResult | 'pending'
  delay?: number
}

const COLORS: Record<string, string> = {
  correct: 'bg-green-600 border-green-500 text-white',
  partial:  'bg-yellow-500 border-yellow-400 text-white',
  wrong:    'bg-gray-700 border-gray-600 text-gray-300',
  pending:  'bg-gray-800 border-gray-700 text-gray-500',
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
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">{label}</span>
      <span className="text-xs font-medium text-center leading-tight">{value ?? '—'}</span>
      {result !== 'pending' && (
        <span className="text-[10px] mt-0.5 opacity-80">{ICONS[result]}</span>
      )}
    </div>
  )
}
