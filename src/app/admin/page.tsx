import { createAdminClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createAdminClient()

  const [{ count: characters }, { count: animes }] = await Promise.all([
    supabase.from('characters').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('animes').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const stats = [
    { label: 'Personnages actifs', value: characters ?? 0, color: 'text-green-400' },
    { label: 'Animes actifs', value: animes ?? 0, color: 'text-indigo-400' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">{s.label}</p>
            <p className={`text-4xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
