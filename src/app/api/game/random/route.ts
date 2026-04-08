import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayUTC } from '@/lib/utils/dates'

export async function GET(request: NextRequest) {
  const mode = (request.nextUrl.searchParams.get('mode') ?? 'classique') as 'classique' | 'citation' | 'silhouette'
  const supabase = await createClient()
  const today = getTodayUTC()

  // Récupérer l'id du défi du jour pour l'exclure
  const { data: daily } = await supabase
    .from('daily_challenges')
    .select('character_id')
    .eq('game_mode', mode)
    .eq('challenge_date', today)
    .single()

  const { data: characters } = await supabase
    .from('characters')
    .select('id')
    .eq('is_active', true)
    .neq('id', daily?.character_id ?? '')

  if (!characters?.length) {
    return NextResponse.json({ error: 'Aucun personnage disponible' }, { status: 404 })
  }

  const randomChar = characters[Math.floor(Math.random() * characters.length)]

  return NextResponse.json({ challengeId: `random-${randomChar.id}`, characterId: randomChar.id, mode })
}
