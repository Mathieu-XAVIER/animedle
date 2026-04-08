/**
 * Extraction d'attributs de personnages depuis le texte biographique Jikan (MAL)
 * + API AniList (gratuite, pas de clé requise) pour le genre
 *
 * Supporte : One Piece, Jujutsu Kaisen, Demon Slayer, Shingeki no Kyojin, My Hero Academia
 */

export interface ExtractedAttributes {
  gender: 'Male' | 'Female' | 'Unknown' | null
  faction: string | null
  power_type: string | null
  weapon_type: string | null
  description_short: string | null
}

// ─── Genre ───────────────────────────────────────────────────────────────────

/**
 * Détecte le genre depuis les pronoms du texte anglais (he/she).
 * Retourne null si le texte est trop court ou ambigu.
 */
export function detectGenderFromPronouns(about: string): 'Male' | 'Female' | 'Unknown' | null {
  if (!about || about.length < 40) return null
  const text = about.toLowerCase()
  const male = (text.match(/\b(he|his|him)\b/g) ?? []).length
  const female = (text.match(/\b(she|her|hers)\b/g) ?? []).length
  if (male === 0 && female === 0) return null
  if (male >= female * 1.5 && male >= 2) return 'Male'
  if (female >= male * 1.5 && female >= 2) return 'Female'
  if (male > 0 && female === 0) return 'Male'
  if (female > 0 && male === 0) return 'Female'
  return 'Unknown'
}

/**
 * Interroge l'API AniList (gratuite, sans clé) pour obtenir le genre structuré.
 * AniList limite à ~90 req/min — on rate-limite côté appelant.
 */
export async function getAniListGender(characterName: string): Promise<'Male' | 'Female' | 'Unknown' | null> {
  const query = `query($search:String){Character(search:$search){gender}}`
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { search: characterName } }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const json = await res.json() as { data?: { Character?: { gender?: string | null } } }
    const g = json.data?.Character?.gender
    if (!g) return null
    const lower = g.toLowerCase()
    if (lower === 'male') return 'Male'
    if (lower === 'female') return 'Female'
    return 'Unknown'
  } catch {
    return null
  }
}

// ─── Faction ─────────────────────────────────────────────────────────────────

const FACTION_PATTERNS: RegExp[] = [
  // "captain/member/... of the Straw Hat Pirates"
  /\b(?:captain|leader|member|founder|commander|vice[- ]captain|combatant|cook|navigator|sniper|swordsman|archaeologist|helmsman|musician|doctor|fighter)\s+of\s+(?:the\s+)?([A-Z][^\n,\.]{3,50}?(?:Pirates|Corps|Squad|Regiment|Battalion|Team|Force|Army|Organization|Clan|Tribe|Guild|Alliance|Brotherhood|Order|Society|Division|Unit|Association|Hashira|Pillars))\b/i,
  // "a member of X"
  /\b(?:a|an|the)\s+member\s+of\s+(?:the\s+)?([A-Z][^\n,\.]{3,50}?(?:Pirates|Corps|Squad|Regiment|Battalion|Team|Force|Army|Organization|Clan|Guild|Alliance|Brotherhood|Order|Society|Division|Pillars))\b/i,
  // "belongs to / affiliated with X"
  /\b(?:belongs?\s+to|affiliated\s+with)\s+(?:the\s+)?([A-Z][^\n,\.]{3,50}?(?:Pirates|Corps|Squad|Team|Force|Army|Organization|Clan|Guild|Alliance|Brotherhood|Order|Division))\b/i,
  // "serves under / part of X"
  /\bpart\s+of\s+(?:the\s+)?([A-Z][^\n,\.]{3,50}?(?:Pirates|Corps|Squad|Team|Force|Army|Organization|Clan|Guild|Alliance|Brotherhood|Order|Division|Hashira))\b/i,
  // One Piece: Yonko / Marines / World Government
  /\b(Yonko|Marines|World Government|Revolutionary Army|Warlord of the Sea|Seven Warlords|Cipher Pol|CP\d+|Rocks Pirates|Big Mom Pirates|Beasts Pirates|Blackbeard Pirates|Red Hair Pirates|Heart Pirates)\b/,
  // JJK: specific factions
  /\b(Jujutsu High|Tokyo Jujutsu High|Kyoto Jujutsu High|Zenin Clan|Gojo Clan|Kamo Clan|Curses|Cursed Spirit Manipulation|Special Grade)\b/,
  // SNK: specific factions
  /\b(Survey Corps|Garrison Regiment|Military Police|Marley Warriors|Titans?|Yeagerists|Royal Government|Wall Cult)\b/,
  // MHA: hero agencies / schools
  /\b(U\.?A\.?\s*High|1-A|Endeavor Agency|Hawks Agency|League of Villains|Meta Liberation Army|Paranormal Liberation Front|Pro Hero)\b/,
  // Demon Slayer: corps / pillars
  /\b(Demon Slayer Corps|Demon Slayers?|Twelve Kizuki|Upper Rank|Lower Rank|Pillars?|Hashira)\b/,
]

export function extractFaction(about: string): string | null {
  for (const pattern of FACTION_PATTERNS) {
    const match = about.match(pattern)
    if (match) {
      // Si groupe capturant → on le prend, sinon on prend le match complet
      const value = (match[1] ?? match[0]).trim()
      if (value.length > 2 && value.length < 60) return value
    }
  }
  return null
}

// ─── Pouvoir ─────────────────────────────────────────────────────────────────

const POWER_PATTERNS: RegExp[] = [
  // One Piece: Devil Fruits / "no Mi"
  /\b(?:ate|consumed|possesses?|eaten)\s+(?:the\s+)?([A-Z][a-zA-Z\s-]+?(?:Fruit|no Mi|no Mi))\b/,
  /\b([A-Z][a-zA-Z\s-]+?(?:no Mi))\b/,
  // One Piece: Haki
  /\b(Conqueror's Haki|Observation Haki|Armament Haki|Haoshoku Haki|Kenbunshoku Haki|Busoshoku Haki)\b/i,
  // JJK: Cursed Techniques
  /\b(?:uses?|possesses?|wields?|has)\s+(?:the\s+)?(?:innate\s+)?(?:cursed\s+)?technique[,:]?\s*[""«]?([A-Z][^\.,"»\n]{3,50})[""»]?/i,
  /\b([A-Z][a-zA-Z\s]+?)\s+(?:Cursed\s+Technique|Domain\s+Expansion)\b/,
  // MHA: Quirks
  /\b(?:Quirk|quirk)\s*(?:is|called|named|:)\s*[""«]?([A-Z][^\.,"»\n]{2,40})[""»]?/i,
  /\b(?:his|her|their)\s+Quirk[,]?\s+[""«]?([A-Z][^\.,"»\n]{2,40})[""»]?/i,
  // Demon Slayer: Breathing Styles
  /\b([A-Z][a-zA-Z\s]+?\s+Breathing)\b/,
  /\b(Sun Breathing|Water Breathing|Flame Breathing|Wind Breathing|Thunder Breathing|Stone Breathing|Serpent Breathing|Insect Breathing|Sound Breathing|Love Breathing|Mist Breathing|Moon Breathing|Flower Breathing)\b/,
  // SNK: Titan powers
  /\b(?:possesses?|inherited?|wields?)\s+(?:the\s+)?([A-Z][a-zA-Z\s]+?\s+Titan)\b/,
  /\b(Attack Titan|Founding Titan|Armored Titan|Colossal Titan|Female Titan|Beast Titan|Jaw Titan|Cart Titan|War Hammer Titan)\b/,
  // Generic power phrases
  /\b(?:ability|power|magic)\s+(?:to|of)\s+([a-zA-Z\s]{4,40})\b/i,
]

export function extractPowerType(about: string): string | null {
  for (const pattern of POWER_PATTERNS) {
    const match = about.match(pattern)
    if (match) {
      const value = (match[1] ?? match[0]).trim()
      if (value.length > 2 && value.length < 60) return value
    }
  }
  return null
}

// ─── Arme / Style ─────────────────────────────────────────────────────────────

const WEAPON_PATTERNS: RegExp[] = [
  // Style d'épée
  /\b([A-Z][a-zA-Z\s]+?(?:Sword\s*Style|Sword\s*Art|Swordsmanship))\b/,
  /\bswords?man\b/i,
  // Types d'armes spécifiques
  /\b(?:wields?|carries?|uses?|armed\s+with)\s+(?:a\s+)?([a-zA-Z\s]{3,30}(?:sword|blade|spear|lance|axe|bow|gun|rifle|pistol|trident|scythe|staff|wand|hammer|club|dagger|knife|katana|naginata))\b/i,
  // Demon Slayer: Nichirin swords
  /\b(Nichirin\s+(?:Sword|Blade|Cleavers?))\b/i,
  // One Piece: weapon types
  /\b(Three\s+Sword\s*Style|Two\s+Sword\s*Style|One\s+Sword\s*Style|Rokushiki|Six\s+Powers|Black\s+Leg\s+Style|Diable\s+Jambe)\b/i,
  // Armes nommées
  /\b(?:his|her)\s+(?:signature\s+)?(?:weapon|tool)\s+(?:is|are|being)\s+(?:a\s+)?([a-zA-Z\s]{3,30})\b/i,
  // Fists / unarmed
  /\b(Gear\s+(?:Second|Third|Fourth|Fifth)|Gomu\s+Gomu|Jet\s+Pistol)\b/i,
]

const WEAPON_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bswords?man\b/i,   label: 'Épée' },
  { pattern: /\bkatana\b/i,       label: 'Katana' },
  { pattern: /\bspear\b/i,        label: 'Lance' },
  { pattern: /\btrident\b/i,      label: 'Trident' },
  { pattern: /\bbow\b/i,          label: 'Arc' },
  { pattern: /\bgun|rifle|pistol\b/i, label: 'Arme à feu' },
  { pattern: /\bscythe\b/i,       label: 'Faux' },
  { pattern: /\bstaff|wand\b/i,   label: 'Bâton' },
  { pattern: /\bhammer\b/i,       label: 'Marteau' },
  { pattern: /\baxe\b/i,          label: 'Hache' },
  { pattern: /\bwhip\b/i,         label: 'Fouet' },
  { pattern: /\bclaw|claws\b/i,   label: 'Griffes' },
  { pattern: /\bfists?|unarmed|hand[- ]to[- ]hand|martial arts\b/i, label: 'Corps-à-corps' },
]

export function extractWeaponType(about: string): string | null {
  // D'abord les patterns de style/technique spécifiques
  for (const pattern of WEAPON_PATTERNS) {
    const match = about.match(pattern)
    if (match) {
      const value = (match[1] ?? match[0]).trim()
      if (value.length > 2 && value.length < 60) return value
    }
  }
  // Ensuite les mots-clés simples traduits
  for (const { pattern, label } of WEAPON_KEYWORDS) {
    if (pattern.test(about)) return label
  }
  return null
}

// ─── Description courte ───────────────────────────────────────────────────────

/**
 * Extrait la première phrase (ou 220 premiers caractères) du texte about
 * et la retourne comme description courte.
 */
export function extractDescriptionShort(about: string): string | null {
  if (!about || about.length < 10) return null
  // Prendre la première phrase complète (jusqu'au premier point)
  const firstSentence = about.split(/\.\s+/)[0]
  if (firstSentence && firstSentence.length <= 240) return firstSentence.trim() + '.'
  // Sinon tronquer à 220 caractères
  return about.slice(0, 220).trimEnd() + '…'
}

// ─── Extraction combinée ──────────────────────────────────────────────────────

/**
 * Extrait tous les attributs depuis le texte about (Jikan).
 * Si withAniList=true, interroge aussi AniList pour le genre.
 * Retourne toujours un objet complet (null si non trouvé).
 */
export async function extractAttributes(
  characterName: string,
  about: string,
  withAniList: boolean,
  aniListDelay = 800
): Promise<ExtractedAttributes> {
  let gender: ExtractedAttributes['gender'] = null

  if (withAniList) {
    await sleep(aniListDelay) // respecter le rate limit AniList
    gender = await getAniListGender(characterName)
  }

  // Fallback : pronoms
  if (!gender) {
    gender = detectGenderFromPronouns(about)
  }

  return {
    gender,
    faction:           extractFaction(about),
    power_type:        extractPowerType(about),
    weapon_type:       extractWeaponType(about),
    description_short: extractDescriptionShort(about),
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
