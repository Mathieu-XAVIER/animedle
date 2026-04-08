import { createAdminClient } from '@/lib/supabase/server'
import DefiForm from './DefiForm'

export default async function DefisPage() {
  const supabase = await createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: defis }, { data: characters }, { data: quotes }] = await Promise.all([
    supabase
      .from('daily_challenges')
      .select('id, game_mode, challenge_date, character_id, quote_id')
      .gte('challenge_date', today)
      .order('challenge_date')
      .order('game_mode')
      .limit(60),
    supabase
      .from('characters')
      .select('id, display_name, anime_id')
      .eq('is_active', true)
      .order('display_name'),
    supabase
      .from('quotes')
      .select('id, character_id, quote_text')
      .eq('is_active', true),
  ])

  // Générer les 14 prochains jours
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().split('T')[0]
  })

  const modes = ['classique', 'citation'] as const

  const defiMap = new Map(
    (defis ?? []).map(d => [`${d.game_mode}__${d.challenge_date}`, d])
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Défis quotidiens</h1>
      <p className="text-gray-400 text-sm">14 prochains jours — Assigner un personnage par mode et par jour.</p>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
              {modes.map(m => (
                <th key={m} className="text-left px-4 py-3 text-gray-400 font-medium capitalize">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {days.map(day => (
              <tr key={day} className="hover:bg-gray-900/30">
                <td className="px-4 py-3 font-mono text-gray-400 text-xs whitespace-nowrap">{day}</td>
                {modes.map(mode => {
                  const existing = defiMap.get(`${mode}__${day}`)
                  return (
                    <td key={mode} className="px-4 py-3">
                      <DefiForm
                        date={day}
                        mode={mode}
                        existing={existing ?? null}
                        characters={characters ?? []}
                        quotes={mode === 'citation' ? (quotes ?? []) : []}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
