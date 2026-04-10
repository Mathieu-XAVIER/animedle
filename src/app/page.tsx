import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const ANIME_COLORS: Record<string, string> = {
  'one-piece':          '#2563eb',
  'jujutsu-kaisen':    '#7c3aed',
  'demon-slayer':      '#dc2626',
  'shingeki-no-kyojin': '#374151',
  'my-hero-academia':  '#d97706',
}

function accentFor(slug: string): string {
  return ANIME_COLORS[slug] ?? '#4338ca'
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: animes } = await supabase
    .from('animes')
    .select('id, slug, title, short_title')
    .eq('is_active', true)
    .order('title')

  const list = animes ?? []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Fond subtil — lignes de grille légères */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        opacity: 0.5,
      }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'rgba(245,244,240,0.88)', backdropFilter: 'blur(12px)' }}>
        <div className="text-xl font-bold tracking-[0.18em]" style={{ fontFamily: 'var(--font-chakra)' }}>
          <span style={{ color: 'var(--accent)' }}>ANIME</span>
          <span style={{ color: 'var(--text)' }}>DLE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full anim-blink" style={{ background: '#16a34a' }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
            EN LIGNE
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-8">

        {/* Hero */}
        <div className="text-center anim-fade-up" style={{ animationDelay: '0s' }}>
          <div className="text-5xl font-bold tracking-[0.10em] mb-2" style={{ fontFamily: 'var(--font-chakra)' }}>
            <span style={{ color: 'var(--accent)' }}>ANIME</span>
            <span style={{ color: 'var(--text)' }}>DLE</span>
          </div>
          <div className="mx-auto h-[2px] w-32 mb-3" style={{
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)'
          }} />
          <p className="text-xs tracking-[0.22em] uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
            Le défi anime quotidien
          </p>
        </div>

        {/* Titre section */}
        <div className="anim-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-4"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
            Choisis ton univers
          </p>

          {list.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Aucun anime disponible pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((anime, i) => {
                const color = accentFor(anime.slug)
                return (
                  <div
                    key={anime.id}
                    className="relative rounded-2xl border overflow-hidden anim-fade-up"
                    style={{
                      background: 'var(--card)',
                      borderColor: 'var(--border)',
                      animationDelay: `${0.15 + i * 0.07}s`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Barre de couleur latérale */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />

                    <div className="pl-5 pr-4 py-4">
                      {/* Nom de l'anime */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-chakra)', color: 'var(--text)' }}>
                          {anime.title}
                        </h2>
                        {anime.short_title && (
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ color, background: `${color}14`, fontFamily: 'var(--font-chakra)' }}>
                            {anime.short_title}
                          </span>
                        )}
                      </div>

                      {/* Boutons de mode */}
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/classique?anime=${anime.slug}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:opacity-85 active:scale-[0.97]"
                          style={{
                            background: color,
                            color: 'white',
                            fontFamily: 'var(--font-chakra)',
                            letterSpacing: '0.06em',
                          }}
                        >
                          <span>⚔</span> CLASSIQUE
                        </Link>
                        <Link
                          href="/classique/illimite"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 hover:opacity-80"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--muted)',
                            fontFamily: 'var(--font-chakra)',
                            letterSpacing: '0.05em',
                          }}
                        >
                          ∞ ILLIMITÉ
                        </Link>
                        <Link
                          href="/citation"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 hover:opacity-80"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--muted)',
                            fontFamily: 'var(--font-chakra)',
                            letterSpacing: '0.05em',
                          }}
                        >
                          ❝ CITATION
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Description rapide des modes */}
        <div className="anim-fade-up" style={{ animationDelay: `${0.2 + list.length * 0.07}s` }}>
          <div className="rounded-2xl border p-4 space-y-2.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] uppercase tracking-[0.16em] font-semibold mb-3"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
              Modes de jeu
            </p>
            <div className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">⚔</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Classique</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Devine le personnage en 6 essais. Les attributs se révèlent par code couleur.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">❝</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Citation</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Retrouve quel personnage a prononcé cette réplique parmi 4 choix.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">∞</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Illimité</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Pas de limite d&apos;essais ni de reset quotidien — joue autant que tu veux.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Animedle · Fan project non officiel · Données issues de MyAnimeList
        </p>
      </footer>
    </div>
  )
}
