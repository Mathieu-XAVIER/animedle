import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import ClassiqueGame from './ClassiqueGame'

export default async function ClassiquePage() {
  const supabase = await createClient()
  const { data: animes } = await supabase.from('animes').select('id, slug, title, short_title').eq('is_active', true)

  const cookieStore = await cookies()
  let sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) sessionId = randomUUID()

  return <ClassiqueGame sessionId={sessionId} animes={animes ?? []} />
}
