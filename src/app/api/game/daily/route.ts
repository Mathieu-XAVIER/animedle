import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayUTC, secondsUntilMidnightUTC } from '@/lib/utils/dates'

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') as 'classique' | 'citation' | null
  if (!mode) return NextResponse.json({ error: 'mode requis' }, { status: 400 })

  const supabase = await createClient()
  const today = getTodayUTC()

  const { data: challenge, error } = await supabase
    .from('daily_challenges')
    .select('id, game_mode, challenge_date, character_id, quote_id')
    .eq('game_mode', mode)
    .eq('challenge_date', today)
    .single()

  if (error || !challenge) {
    return NextResponse.json({ error: 'Aucun défi pour aujourd\'hui' }, { status: 404 })
  }

  // Pour le mode citation : récupérer la citation + générer 3 leurres
  if (mode === 'citation' && challenge.quote_id) {
    const [{ data: quote }, { data: allChars }] = await Promise.all([
      supabase.from('quotes').select('id, quote_text, character_id').eq('id', challenge.quote_id).single(),
      supabase
        .from('characters')
        .select('id, display_name')
        .eq('is_active', true)
        .neq('id', challenge.character_id)
        .limit(50),
    ])

    const { data: targetChar } = await supabase
      .from('characters')
      .select('id, display_name')
      .eq('id', challenge.character_id)
      .single()

    const decoys = (allChars ?? [])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const options = [...decoys, targetChar]
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)

    return NextResponse.json(
      { challengeId: challenge.id, mode, quote, options },
      { headers: { 'Cache-Control': `public, s-maxage=${secondsUntilMidnightUTC()}` } }
    )
  }

  return NextResponse.json(
    { challengeId: challenge.id, mode },
    { headers: { 'Cache-Control': `public, s-maxage=${secondsUntilMidnightUTC()}` } }
  )
}
