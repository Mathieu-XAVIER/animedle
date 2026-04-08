import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayUTC, secondsUntilMidnightUTC } from '@/lib/utils/dates'

/** Hash déterministe d'une chaîne → index dans [0, length[ */
function deterministicIndex(seed: string, length: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash * 31 + seed.charCodeAt(i), 1) >>> 0
  }
  return hash % length
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') as 'classique' | 'citation' | null
  if (!mode) return NextResponse.json({ error: 'mode requis' }, { status: 400 })

  const supabase = await createClient()
  const today = getTodayUTC()

  // Chercher un défi existant pour aujourd'hui
  let { data: challenge } = await supabase
    .from('daily_challenges')
    .select('id, game_mode, challenge_date, character_id, quote_id')
    .eq('game_mode', mode)
    .eq('challenge_date', today)
    .single()

  // Aucun défi planifié → générer automatiquement
  if (!challenge) {
    if (mode === 'citation') {
      // Pour citation : choisir une citation active de façon déterministe
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, character_id')
        .eq('is_active', true)
        .order('created_at')

      if (!quotes?.length) {
        return NextResponse.json({ error: 'Aucune citation disponible' }, { status: 404 })
      }

      const idx = deterministicIndex(today + mode, quotes.length)
      const picked = quotes[idx]

      const { data: created } = await supabase
        .from('daily_challenges')
        .upsert(
          { game_mode: mode, challenge_date: today, character_id: picked.character_id, quote_id: picked.id },
          { onConflict: 'game_mode,challenge_date' }
        )
        .select('id, game_mode, challenge_date, character_id, quote_id')
        .single()

      challenge = created
    } else {
      // Pour classique / silhouette : choisir un personnage actif de façon déterministe
      const { data: characters } = await supabase
        .from('characters')
        .select('id')
        .eq('is_active', true)
        .order('created_at')

      if (!characters?.length) {
        return NextResponse.json({ error: 'Aucun personnage disponible' }, { status: 404 })
      }

      const idx = deterministicIndex(today + mode, characters.length)
      const characterId = characters[idx].id

      const { data: created } = await supabase
        .from('daily_challenges')
        .upsert(
          { game_mode: mode, challenge_date: today, character_id: characterId },
          { onConflict: 'game_mode,challenge_date' }
        )
        .select('id, game_mode, challenge_date, character_id, quote_id')
        .single()

      challenge = created
    }
  }

  if (!challenge) {
    return NextResponse.json({ error: 'Impossible de créer le défi' }, { status: 500 })
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
