'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { normalizeString } from '@/lib/utils/normalize'
import type { Tables } from '@/types/database'

type StagingCharacter = Tables<'staging_characters'>
type Anime = Pick<Tables<'animes'>, 'id' | 'slug' | 'title'>

interface Props {
  staging: StagingCharacter
  animes: Anime[]
}

interface AliasEntry { alias: string }
interface QuoteEntry { quote_text: string; language: string; is_spoiler: boolean }

export default function CharacterForm({ staging, animes }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    display_name: staging.name ?? '',
    name: staging.name ?? '',
    anime_id: animes.find(a => a.slug === staging.anime_slug)?.id ?? '',
    gender: '',
    role_type: staging.role_source === 'Main' ? 'main' : 'supporting',
    faction: '',
    power_type: '',
    weapon_type: '',
    difficulty: 'medium',
    description_short: '',
  })

  const [aliases, setAliases] = useState<AliasEntry[]>([{ alias: staging.name ?? '' }])
  const [quotes, setQuotes] = useState<QuoteEntry[]>([])

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addAlias() { setAliases(prev => [...prev, { alias: '' }]) }
  function removeAlias(i: number) { setAliases(prev => prev.filter((_, idx) => idx !== i)) }
  function updateAlias(i: number, value: string) {
    setAliases(prev => prev.map((a, idx) => idx === i ? { alias: value } : a))
  }

  function addQuote() { setQuotes(prev => [...prev, { quote_text: '', language: 'fr', is_spoiler: false }]) }
  function removeQuote(i: number) { setQuotes(prev => prev.filter((_, idx) => idx !== i)) }
  function updateQuote(i: number, field: string, value: string | boolean) {
    setQuotes(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  async function handlePublish() {
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/admin/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stagingId: staging.id,
        character: form,
        aliases: aliases.filter(a => a.alias.trim()).map(a => ({
          alias: a.alias,
          normalized_alias: normalizeString(a.alias),
        })),
        quotes: quotes.filter(q => q.quote_text.trim()),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setMessage(`Erreur : ${data.error}`)
    } else {
      setMessage('Personnage publié avec succès !')
      setTimeout(() => router.push('/admin/staging'), 1500)
    }
    setSaving(false)
  }

  async function handleReject() {
    setSaving(true)
    await fetch(`/api/admin/staging/${staging.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validation_status: 'rejected' }),
    })
    router.push('/admin/staging')
  }

  const inputClass = 'w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm'
  const labelClass = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="space-y-6">
      {/* Infos de base */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Informations de base</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom affiché *</label>
            <input className={inputClass} value={form.display_name} onChange={e => updateForm('display_name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Nom interne</label>
            <input className={inputClass} value={form.name} onChange={e => updateForm('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Anime *</label>
            <select className={inputClass} value={form.anime_id} onChange={e => updateForm('anime_id', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {animes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Genre</label>
            <select className={inputClass} value={form.gender} onChange={e => updateForm('gender', e.target.value)}>
              <option value="">—</option>
              <option value="Male">Masculin</option>
              <option value="Female">Féminin</option>
              <option value="Unknown">Inconnu</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Rôle</label>
            <select className={inputClass} value={form.role_type} onChange={e => updateForm('role_type', e.target.value)}>
              <option value="main">Principal</option>
              <option value="supporting">Secondaire</option>
              <option value="antagonist">Antagoniste</option>
              <option value="minor">Mineur</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Difficulté</label>
            <select className={inputClass} value={form.difficulty} onChange={e => updateForm('difficulty', e.target.value)}>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Faction</label>
            <input className={inputClass} value={form.faction} onChange={e => updateForm('faction', e.target.value)} placeholder="ex: Marines" />
          </div>
          <div>
            <label className={labelClass}>Type de pouvoir</label>
            <input className={inputClass} value={form.power_type} onChange={e => updateForm('power_type', e.target.value)} placeholder="ex: Fruit du Démon" />
          </div>
          <div>
            <label className={labelClass}>Arme / Style</label>
            <input className={inputClass} value={form.weapon_type} onChange={e => updateForm('weapon_type', e.target.value)} placeholder="ex: Épée" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Description courte</label>
          <textarea className={inputClass} rows={2} value={form.description_short} onChange={e => updateForm('description_short', e.target.value)} />
        </div>
      </section>

      {/* Alias */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Alias</h2>
          <button onClick={addAlias} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Ajouter</button>
        </div>
        {aliases.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={`${inputClass} flex-1`}
              value={a.alias}
              onChange={e => updateAlias(i, e.target.value)}
              placeholder="Alias ou variante d'écriture"
            />
            <button onClick={() => removeAlias(i)} className="text-gray-500 hover:text-red-400 text-sm px-2">✕</button>
          </div>
        ))}
      </section>

      {/* Citations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Citations</h2>
          <button onClick={addQuote} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Ajouter</button>
        </div>
        {quotes.map((q, i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-3 space-y-2 border border-gray-800">
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={q.quote_text}
              onChange={e => updateQuote(i, 'quote_text', e.target.value)}
              placeholder="Texte de la citation"
            />
            <div className="flex gap-3 items-center">
              <select className={`${inputClass} w-auto`} value={q.language} onChange={e => updateQuote(i, 'language', e.target.value)}>
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="jp">Japonais</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={q.is_spoiler} onChange={e => updateQuote(i, 'is_spoiler', e.target.checked)} className="accent-indigo-500" />
                Spoiler
              </label>
              <button onClick={() => removeQuote(i)} className="ml-auto text-gray-500 hover:text-red-400 text-sm">Supprimer</button>
            </div>
          </div>
        ))}
      </section>

      {/* Actions */}
      {message && (
        <p className={`text-sm ${message.startsWith('Erreur') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={handlePublish}
          disabled={saving || !form.display_name || !form.anime_id}
          className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Publication...' : 'Publier le personnage'}
        </button>
        <button
          onClick={handleReject}
          disabled={saving}
          className="bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-300 px-6 py-2 rounded-lg font-medium text-sm border border-gray-700 disabled:opacity-50"
        >
          Rejeter
        </button>
      </div>
    </div>
  )
}
