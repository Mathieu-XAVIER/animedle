'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/database'

type StagingCharacter = Tables<'staging_characters'>

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  approved: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
}

const ANIME_FILTERS = ['', 'one-piece', 'jjk', 'demon-slayer', 'snk', 'mha']
const STATUS_FILTERS = ['', 'pending', 'approved', 'rejected']

interface Props {
  characters: StagingCharacter[]
  currentAnime?: string
  currentStatus?: string
}

export default function StagingTable({ characters, currentAnime, currentStatus }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ published: number; skipped: number; errors: string[] } | null>(null)

  const pendingOnly = characters.filter(c => c.validation_status === 'pending')
  const allPendingSelected = pendingOnly.length > 0 && pendingOnly.every(c => selected.has(c.id))

  function toggleAll() {
    if (allPendingSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingOnly.map(c => c.id)))
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function buildHref(anime?: string, status?: string) {
    const p = new URLSearchParams()
    if (anime) p.set('anime', anime)
    if (status) p.set('status', status)
    return `/admin/staging?${p}`
  }

  async function bulkPublish() {
    setResult(null)
    startTransition(async () => {
      const res = await fetch('/api/admin/characters/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagingIds: [...selected] }),
      })
      const data = await res.json()
      setResult(data)
      setSelected(new Set())
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staging — {characters.length} personnages</h1>
        {selected.size > 0 && (
          <button
            onClick={bulkPublish}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {isPending ? 'Publication...' : `Publier ${selected.size} personnage${selected.size > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Résultat bulk */}
      {result && (
        <div className={`rounded-lg p-3 text-sm border ${result.errors.length ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-green-900/20 border-green-700 text-green-300'}`}>
          ✓ {result.published} publié{result.published > 1 ? 's' : ''}
          {result.skipped > 0 && `, ${result.skipped} ignoré${result.skipped > 1 ? 's' : ''}`}
          {result.errors.length > 0 && (
            <ul className="mt-1 text-xs list-disc list-inside text-yellow-400">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap items-center">
        {ANIME_FILTERS.map(a => (
          <Link
            key={a}
            href={buildHref(a || undefined, currentStatus)}
            className={`px-3 py-1 rounded-full text-sm ${currentAnime === a || (!a && !currentAnime) ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {a || 'Tous'}
          </Link>
        ))}
        <span className="text-gray-600">|</span>
        {STATUS_FILTERS.map(s => (
          <Link
            key={s}
            href={buildHref(currentAnime, s || undefined)}
            className={`px-3 py-1 rounded-full text-sm ${currentStatus === s || (!s && !currentStatus) ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {s ? STATUS_LABELS[s] : 'Tous statuts'}
          </Link>
        ))}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={toggleAll}
                  className="accent-indigo-500 cursor-pointer"
                  title="Sélectionner tous les 'En attente'"
                />
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Nom</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Anime</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Rôle</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">Favoris</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {characters.map(c => {
              const isPending = c.validation_status === 'pending'
              const isSelected = selected.has(c.id)
              return (
                <tr
                  key={c.id}
                  className={`transition-colors ${isSelected ? 'bg-indigo-900/20' : 'hover:bg-gray-900/50'}`}
                >
                  <td className="px-4 py-3">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(c.id)}
                        className="accent-indigo-500 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-400 uppercase text-xs">{c.anime_slug}</td>
                  <td className="px-4 py-3 text-gray-400">{c.role_source}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{c.favorites?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.validation_status ?? 'pending']}`}>
                      {STATUS_LABELS[c.validation_status ?? 'pending']}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/staging/${c.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-xs"
                    >
                      Éditer →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
