import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import ClassiqueGame from '../ClassiqueGame'

export default async function IllimitePage() {
  const supabase = await createClient()

  const [{ data: animes }, randomRes] = await Promise.all([
    supabase.from('animes').select('id, slug, title, short_title').eq('is_active', true),
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}` : 'http://localhost:3000'}/api/game/random?mode=classique`, { cache: 'no-store' }),
  ])

  const cookieStore = await cookies()
  let sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) sessionId = randomUUID()

  let targetCharacterId: string | undefined
  if (randomRes.ok) {
    const data = await randomRes.json()
    targetCharacterId = data.characterId
  }

  return (
    <ClassiqueGame
      sessionId={sessionId}
      animes={animes ?? []}
      isIllimite
      targetCharacterId={targetCharacterId}
    />
  )
}
