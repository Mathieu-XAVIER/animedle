'use client'

import { useState } from 'react'

interface Character { id: string; display_name: string; anime_id: string }
interface Quote { id: string; character_id: string; quote_text: string }
interface ExistingDefi { id: string; game_mode: string; challenge_date: string; character_id: string; quote_id: string | null }

interface Props {
  date: string
  mode: 'classique' | 'citation'
  existing: ExistingDefi | null
  characters: Character[]
  quotes: Quote[]
}

export default function DefiForm({ date, mode, existing, characters, quotes }: Props) {
  const [characterId, setCharacterId] = useState(existing?.character_id ?? '')
  const [quoteId, setQuoteId] = useState(existing?.quote_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filteredQuotes = quotes.filter(q => q.character_id === characterId)

  async function save() {
    if (!characterId) return
    setSaving(true)
    setSaved(false)

    await fetch('/api/admin/defis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_mode: mode,
        challenge_date: date,
        character_id: characterId,
        quote_id: mode === 'citation' ? quoteId || null : null,
      }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selectClass = 'bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-indigo-500 text-xs w-full'

  return (
    <div className="space-y-1 min-w-[200px]">
      <select className={selectClass} value={characterId} onChange={e => { setCharacterId(e.target.value); setQuoteId('') }}>
        <option value="">— Personnage —</option>
        {characters.map(c => (
          <option key={c.id} value={c.id}>{c.display_name}</option>
        ))}
      </select>

      {mode === 'citation' && characterId && (
        <select className={selectClass} value={quoteId} onChange={e => setQuoteId(e.target.value)}>
          <option value="">— Citation —</option>
          {filteredQuotes.map(q => (
            <option key={q.id} value={q.id}>{q.quote_text.slice(0, 50)}...</option>
          ))}
        </select>
      )}

      <button
        onClick={save}
        disabled={saving || !characterId}
        className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-1 rounded"
      >
        {saving ? '...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
      </button>
    </div>
  )
}
