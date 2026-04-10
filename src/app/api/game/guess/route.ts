import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compareCharacters } from '@/lib/game/compare'

export async function POST(request: NextRequest) {
  const { challengeId, characterId, sessionId, targetCharacterId } = await request.json()

  if (!challengeId || !characterId || !sessionId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = await createClient()

  // Résoudre la cible : soit depuis daily_challenges, soit depuis targetCharacterId (illimité)
  let targetId: string
  let gameMode = 'classique'

  if (targetCharacterId) {
    targetId = targetCharacterId
  } else {
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('character_id, game_mode')
      .eq('id', challengeId)
      .single()
    if (!challenge) return NextResponse.json({ error: 'Challenge introuvable' }, { status: 404 })
    targetId = challenge.character_id
    gameMode = challenge.game_mode
  }

  const [{ data: guessChar }, { data: targetChar }] = await Promise.all([
    supabase.from('characters').select('*').eq('id', characterId).single(),
    supabase.from('characters').select('*').eq('id', targetId).single(),
  ])

  if (!guessChar || !targetChar) {
    return NextResponse.json({ error: 'Personnage introuvable' }, { status: 404 })
  }

  const isCorrect = guessChar.id === targetChar.id

  // Enregistrer uniquement pour les défis officiels (pas l'illimité)
  if (!targetCharacterId) {
    const { count: attemptsCount } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('challenge_id', challengeId)

    await supabase.from('game_sessions').insert({
      session_id:  sessionId,
      challenge_id: challengeId,
      game_mode:   gameMode as 'classique' | 'citation' | 'silhouette',
      attempts:    (attemptsCount ?? 0) + 1,
      is_won:      isCorrect,
    })
  }

  const comparison = compareCharacters(guessChar, targetChar)

  const response: Record<string, unknown> = {
    comparison,
    isCorrect,
    guessCharacter: {
      id:              guessChar.id,
      display_name:    guessChar.display_name,
      anime_id:        guessChar.anime_id,
      gender:          guessChar.gender,
      role_type:       guessChar.role_type,
      faction:         guessChar.faction,
      power_type:      guessChar.power_type,
      weapon_type:     guessChar.weapon_type,
      status:          guessChar.status,
      species:         guessChar.species,
      age_range:       guessChar.age_range,
      popularity_rank: guessChar.popularity_rank,
    },
  }

  if (isCorrect) {
    response.targetCharacter = {
      id:           targetChar.id,
      display_name: targetChar.display_name,
      anime_id:     targetChar.anime_id,
    }
  }

  return NextResponse.json(response)
}
