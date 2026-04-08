'use client'

import { useState } from 'react'
import animesConfig from '../../../../scripts/animes-config.json'

const animes = Object.entries(animesConfig).map(([slug, conf]) => ({ slug, ...conf }))

export default function AdminImportPage() {
  const [selected, setSelected] = useState(animes[0].slug)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  async function handleImport() {
    setLoading(true)
    setResult(null)
    setError('')

    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animeSlug: selected }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setResult(data)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Import depuis Jikan</h1>
      <p className="text-gray-400 text-sm">
        Importe les 30 personnages les plus populaires de l&apos;anime sélectionné dans la table staging.
      </p>

      <div className="space-y-3">
        <label className="block text-sm text-gray-400">Anime</label>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
        >
          {animes.map(a => (
            <option key={a.slug} value={a.slug}>{a.title}</option>
          ))}
        </select>

        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Import en cours...' : 'Lancer l\'import'}
        </button>
      </div>

      {result && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-green-300 text-sm">
          ✓ <strong>{result.imported}</strong> personnages importés,{' '}
          <strong>{result.skipped}</strong> doublons ignorés.
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          Erreur : {error}
        </div>
      )}
    </div>
  )
}
