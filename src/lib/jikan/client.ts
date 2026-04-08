const JIKAN_BASE = 'https://api.jikan.moe/v4'
const DELAY_MS = 400 // ~2.5 req/s, sous la limite de 3/s

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJikan<T>(path: string, retries = 3): Promise<T> {
  await sleep(DELAY_MS)
  const res = await fetch(`${JIKAN_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (res.status === 429) {
    console.warn(`[Jikan] Rate limit atteint sur ${path}, attente 5s...`)
    await sleep(5000)
    if (retries > 0) return fetchJikan<T>(path, retries - 1)
    throw new Error(`Rate limit persistant sur ${path}`)
  }

  if (!res.ok) {
    throw new Error(`[Jikan] Erreur ${res.status} sur ${path}`)
  }

  return res.json() as Promise<T>
}

export interface JikanCharacterEntry {
  character: {
    mal_id: number
    name: string
    name_kanji?: string
    images?: { jpg?: { image_url?: string; small_image_url?: string }; webp?: { image_url?: string } }
    favorites?: number
    url?: string
  }
  role: string
  voice_actors?: Array<{
    person: { mal_id: number; name: string; url?: string }
    language: string
  }>
}

export interface JikanCharacterDetail {
  data: {
    mal_id: number
    name: string
    name_kanji?: string
    nicknames?: string[]
    images?: { jpg?: { image_url?: string }; webp?: { image_url?: string } }
    favorites?: number
    about?: string
    anime?: Array<{ role: string; anime: { mal_id: number; title: string } }>
    manga?: Array<{ role: string; manga: { mal_id: number; title: string } }>
  }
}

export async function getAnimeCharacters(malId: number): Promise<JikanCharacterEntry[]> {
  const data = await fetchJikan<{ data: JikanCharacterEntry[] }>(
    `/anime/${malId}/characters`
  )
  return data.data
}

export async function getCharacterDetail(charId: number): Promise<JikanCharacterDetail> {
  return fetchJikan<JikanCharacterDetail>(`/characters/${charId}`)
}
