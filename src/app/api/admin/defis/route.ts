import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { TablesInsert } from '@/types/database'

export async function POST(request: NextRequest) {
  const { game_mode, challenge_date, character_id, quote_id } = await request.json()
  const supabase = await createAdminClient()

  const insert: TablesInsert<'daily_challenges'> = {
    game_mode,
    challenge_date,
    character_id,
    quote_id: quote_id || null,
  }

  const { data, error } = await supabase
    .from('daily_challenges')
    .upsert(insert, { onConflict: 'game_mode,challenge_date' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function GET() {
  const supabase = await createAdminClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_challenges')
    .select(`
      id, game_mode, challenge_date,
      characters (id, display_name, anime_id),
      quotes (id, quote_text)
    `)
    .gte('challenge_date', today)
    .order('challenge_date')
    .order('game_mode')
    .limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
