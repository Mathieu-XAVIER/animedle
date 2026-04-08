'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchResult {
  id: string
  display_name: string
  anime_id: string
  short_title: string | null
}

interface Props {
  onSelect: (id: string) => void
  excludeIds?: string[]
  disabled?: boolean
}

export default function CharacterSearch({ onSelect, excludeIds = [], disabled }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(query)}`)
      const data: SearchResult[] = await res.json()
      setResults(data.filter(r => !excludeIds.includes(r.id)))
      setOpen(true)
    }, 300)
  }, [query, excludeIds])

  function handleSelect(result: SearchResult) {
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect(result.id)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Rechercher un personnage..."
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors duration-200 disabled:opacity-40"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-barlow)',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
      <style>{`input::placeholder { color: var(--muted); }`}</style>
      {open && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-2xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {results.map(r => (
            <li
              key={r.id}
              onMouseDown={() => handleSelect(r)}
              className="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors duration-150"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.display_name}</span>
              {r.short_title && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                  fontFamily: 'var(--font-chakra)',
                  letterSpacing: '0.04em',
                }}>
                  {r.short_title}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
