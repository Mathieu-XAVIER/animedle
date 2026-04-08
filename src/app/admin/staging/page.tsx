import { createAdminClient } from '@/lib/supabase/server'
import StagingTable from './StagingTable'

export default async function StagingPage({
  searchParams,
}: {
  searchParams: Promise<{ anime?: string; status?: string }>
}) {
  const { anime, status } = await searchParams
  const supabase = await createAdminClient()

  let query = supabase
    .from('staging_characters')
    .select('*')
    .order('favorites', { ascending: false })

  if (anime) query = query.eq('anime_slug', anime)
  if (status) query = query.eq('validation_status', status as 'pending' | 'approved' | 'rejected')

  const { data: characters } = await query

  return (
    <StagingTable
      characters={characters ?? []}
      currentAnime={anime}
      currentStatus={status}
    />
  )
}
