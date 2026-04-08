import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CharacterForm from './CharacterForm'

export default async function StagingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: staging } = await supabase
    .from('staging_characters')
    .select('*')
    .eq('id', id)
    .single()

  if (!staging) notFound()

  const { data: animes } = await supabase
    .from('animes')
    .select('id, slug, title')
    .order('title')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{staging.name}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {staging.anime_slug} · {staging.role_source} · {staging.favorites?.toLocaleString()} favoris
        </p>
      </div>

      {staging.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={staging.image_url} alt={staging.name ?? ''} className="w-24 h-24 object-cover rounded-lg" />
      )}

      <CharacterForm staging={staging} animes={animes ?? []} />
    </div>
  )
}
