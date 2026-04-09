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

interface ExtractedAttributes {
  gender?: 'Male' | 'Female' | 'Unknown' | null
  faction?: string | null
  power_type?: string | null
  weapon_type?: string | null
  description_short?: string | null
  status?: 'alive' | 'deceased' | 'unknown' | null
  species?: string | null
  age_range?: 'enfant' | 'adolescent' | 'adulte' | 'ancien' | null
  voice_actor_jp?: string | null
}

interface JikanRaw {

  about?: string | null
  nicknames?: string[]
  extracted?: ExtractedAttributes
  entry?: {
    character?: { name_kanji?: string; url?: string }
    voice_actors?: Array<{ person: { name: string }; language: string }>
  }
}

function parseRawJson(raw: unknown): JikanRaw {
  if (!raw || typeof raw !== 'object') return {}
  return raw as JikanRaw
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

export default function CharacterForm({ staging, animes }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const jikan = parseRawJson(staging.raw_json)
  const jikanAbout = jikan.about ?? ''
  const jikanNicknames: string[] = jikan.nicknames ?? []
  const japaneseVA = jikan.entry?.voice_actors?.find(va => va.language === 'Japanese')
  const ext = jikan.extracted ?? {}
  const hasExtracted = Object.keys(ext).length > 0

  // Pré-remplissage depuis les données source + attributs extraits
  const [form, setForm] = useState({
    display_name: staging.name ?? '',
    name: staging.name ?? '',
    anime_id: animes.find(a => a.slug === staging.anime_slug)?.id ?? '',
    gender: ext.gender ?? '',
    role_type: staging.role_source === 'Main' ? 'main'
      : staging.role_source === 'Antagonist' ? 'antagonist'
      : 'supporting',
    faction: ext.faction ?? '',
    power_type: ext.power_type ?? '',
    weapon_type: ext.weapon_type ?? '',
    difficulty: staging.role_source === 'Main' ? 'easy' : 'medium',
    description_short: ext.description_short ?? (jikanAbout ? truncate(jikanAbout, 220) : ''),
    status: ext.status ?? '',
    species: ext.species ?? '',
    age_range: ext.age_range ?? '',
  })

  const initialAliases: AliasEntry[] = [
    { alias: staging.name ?? '' },
    ...jikanNicknames.map(n => ({ alias: n })),
  ].filter((a, i, arr) => a.alias && arr.findIndex(b => b.alias === a.alias) === i)

  const [aliases, setAliases] = useState<AliasEntry[]>(initialAliases.length ? initialAliases : [{ alias: staging.name ?? '' }])
  const [quotes, setQuotes] = useState<QuoteEntry[]>([])
  const [showAbout, setShowAbout] = useState(false)

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

      {/* Fiche Jikan (référence) */}
      <section className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Données Jikan (référence)</h2>
          {hasExtracted && (
            <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">✦ Enrichi par IA</span>
          )}
        </div>
        <div className="flex gap-4">
          {staging.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={staging.image_url} alt={staging.name ?? ''} className="w-20 h-28 object-cover rounded-lg shrink-0 border border-gray-700" />
          )}
          <div className="space-y-1.5 text-sm min-w-0">
            <p><span className="text-gray-500">Nom :</span> <span className="text-white font-medium">{staging.name}</span></p>
            {jikan.entry?.character?.name_kanji && (
              <p><span className="text-gray-500">Kanji :</span> <span className="text-gray-300">{jikan.entry.character.name_kanji}</span></p>
            )}
            <p><span className="text-gray-500">Rôle Jikan :</span> <span className="text-gray-300">{staging.role_source}</span></p>
            <p><span className="text-gray-500">Favorites MAL :</span> <span className="text-gray-300">{staging.favorites?.toLocaleString()}</span></p>
            {japaneseVA && (
              <p><span className="text-gray-500">VA JP :</span> <span className="text-gray-300">{japaneseVA.person.name}</span></p>
            )}
            {jikanNicknames.length > 0 && (
              <p><span className="text-gray-500">Surnoms :</span> <span className="text-gray-300">{jikanNicknames.join(', ')}</span></p>
            )}
            {hasExtracted && (
              <div className="mt-1 pt-1 border-t border-gray-700 space-y-0.5">
                {ext.gender && <p><span className="text-gray-500">Genre :</span> <span className="text-green-400">{ext.gender}</span></p>}
                {ext.faction && <p><span className="text-gray-500">Faction :</span> <span className="text-green-400">{ext.faction}</span></p>}
                {ext.power_type && <p><span className="text-gray-500">Pouvoir :</span> <span className="text-green-400">{ext.power_type}</span></p>}
                {ext.weapon_type && <p><span className="text-gray-500">Arme :</span> <span className="text-green-400">{ext.weapon_type}</span></p>}
                {ext.species && <p><span className="text-gray-500">Espèce :</span> <span className="text-green-400">{ext.species}</span></p>}
                {ext.status && <p><span className="text-gray-500">Statut :</span> <span className="text-green-400">{ext.status}</span></p>}
                {ext.age_range && <p><span className="text-gray-500">Âge :</span> <span className="text-green-400">{ext.age_range}</span></p>}
                {ext.voice_actor_jp && <p><span className="text-gray-500">VA JP :</span> <span className="text-green-400">{ext.voice_actor_jp}</span></p>}
              </div>
            )}
          </div>
        </div>
        {jikanAbout && (
          <div>
            <button
              onClick={() => setShowAbout(v => !v)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              {showAbout ? 'Masquer la biographie' : 'Afficher la biographie Jikan'}
            </button>
            {showAbout && (
              <p className="mt-2 text-xs text-gray-400 leading-relaxed bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {jikanAbout}
              </p>
            )}
          </div>
        )}
        {!jikanAbout && (
          <p className="text-xs text-gray-600 italic">Aucune biographie disponible (importer avec --no-details pour accélérer, ou les détails n&apos;ont pas été récupérés)</p>
        )}
      </section>

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
            <label className={labelClass}>Faction / Affiliation {ext.faction && <span className="text-green-500">✦</span>}</label>
            <input className={inputClass} value={form.faction} onChange={e => updateForm('faction', e.target.value)} placeholder="ex: Marines" />
          </div>
          <div>
            <label className={labelClass}>Type de pouvoir {ext.power_type && <span className="text-green-500">✦</span>}</label>
            <input className={inputClass} value={form.power_type} onChange={e => updateForm('power_type', e.target.value)} placeholder="ex: Fruit du Démon" />
          </div>
          <div>
            <label className={labelClass}>Arme / Style {ext.weapon_type && <span className="text-green-500">✦</span>}</label>
            <input className={inputClass} value={form.weapon_type} onChange={e => updateForm('weapon_type', e.target.value)} placeholder="ex: Épée" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Statut {ext.status && <span className="text-green-500">✦</span>}</label>
            <select className={inputClass} value={form.status} onChange={e => updateForm('status', e.target.value)}>
              <option value="">—</option>
              <option value="alive">Vivant</option>
              <option value="deceased">Décédé</option>
              <option value="unknown">Inconnu</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Espèce / Race {ext.species && <span className="text-green-500">✦</span>}</label>
            <input className={inputClass} value={form.species} onChange={e => updateForm('species', e.target.value)} placeholder="ex: humain, démon, titan…" />
          </div>
          <div>
            <label className={labelClass}>Tranche d&apos;âge {ext.age_range && <span className="text-green-500">✦</span>}</label>
            <select className={inputClass} value={form.age_range} onChange={e => updateForm('age_range', e.target.value)}>
              <option value="">—</option>
              <option value="enfant">Enfant</option>
              <option value="adolescent">Adolescent</option>
              <option value="adulte">Adulte</option>
              <option value="ancien">Ancien</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Description courte {jikanAbout && <span className="text-indigo-500">(pré-remplie depuis Jikan)</span>}</label>
          <textarea className={inputClass} rows={3} value={form.description_short} onChange={e => updateForm('description_short', e.target.value)} />
        </div>
      </section>

      {/* Alias */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Alias {jikanNicknames.length > 0 && <span className="text-indigo-500 normal-case font-normal text-xs">(surnoms Jikan inclus)</span>}
          </h2>
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
        {quotes.length === 0 && (
          <p className="text-xs text-gray-600 italic">Aucune citation — les citations ne sont pas disponibles via Jikan, à saisir manuellement.</p>
        )}
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
