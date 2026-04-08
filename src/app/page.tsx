import Link from 'next/link'

const MODES = [
  {
    id: 'classique',
    label: 'Mode Classique',
    tag: '⚔',
    description: 'Devine le personnage en 6 essais. Chaque tentative révèle des attributs par code couleur.',
    href: '/classique',
    illimite: '/classique/illimite',
    color: '#6366f1',
  },
  {
    id: 'citation',
    label: 'Mode Citation',
    tag: '❝',
    description: 'Une phrase, quatre choix. Retrouve quel personnage a prononcé ces mots.',
    href: '/citation',
    illimite: null,
    color: '#8b5cf6',
  },
]

const ANIMES = [
  'One Piece',
  'Jujutsu Kaisen',
  'Demon Slayer',
  'Shingeki no Kyojin',
  'My Hero Academia',
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Ambient orbs */}
      <div className="absolute pointer-events-none anim-float" style={{
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        top: -180, left: -120,
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        bottom: -100, right: -80,
        animation: 'orbitFloat 16s ease-in-out infinite reverse',
      }} />

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.35,
      }} />

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'rgba(3,3,8,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="text-xl font-bold tracking-[0.18em] anim-glow" style={{ fontFamily: 'var(--font-chakra)' }}>
          <span style={{ color: 'var(--accent)' }}>ANIME</span>
          <span style={{ color: 'var(--text)' }}>DLE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full anim-blink" style={{ background: '#22c55e' }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
            EN LIGNE
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">

        {/* Logo */}
        <div className="mb-3 anim-fade-up" style={{ animationDelay: '0s' }}>
          <div className="text-6xl font-bold anim-glow" style={{ fontFamily: 'var(--font-chakra)', letterSpacing: '0.12em' }}>
            <span style={{ color: 'var(--accent)' }}>ANIME</span>
            <span style={{ color: 'var(--text)' }}>DLE</span>
          </div>
          <div className="mt-2 mx-auto h-px w-40" style={{
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)'
          }} />
        </div>

        <p className="text-sm tracking-[0.22em] uppercase mb-8 anim-fade-up"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)', animationDelay: '0.1s' }}>
          Le défi anime quotidien
        </p>

        {/* Mode cards */}
        <div className="w-full max-w-md space-y-3 mb-10">
          {MODES.map((mode, i) => (
            <div key={mode.id} className="anim-fade-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
              <div className="relative overflow-hidden rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {/* Top accent bar */}
                <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${mode.color}, transparent)` }} />
                {/* Decorative tag */}
                <div className="absolute right-5 top-4 text-5xl font-bold opacity-[0.04] select-none pointer-events-none"
                  style={{ fontFamily: 'var(--font-chakra)', color: mode.color, lineHeight: 1 }}>
                  {mode.tag}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: `${mode.color}18`, border: `1px solid ${mode.color}28` }}>
                      {mode.tag}
                    </div>
                    <h2 className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-chakra)' }}>
                      {mode.label}
                    </h2>
                  </div>

                  <p className="text-sm mb-4 leading-relaxed text-left" style={{ color: 'var(--muted)' }}>
                    {mode.description}
                  </p>

                  <div className="flex gap-2">
                    <Link
                      href={mode.href}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                      style={{ background: mode.color, color: 'white', fontFamily: 'var(--font-chakra)', letterSpacing: '0.06em' }}
                    >
                      JOUER
                    </Link>
                    {mode.illimite && (
                      <Link
                        href={mode.illimite}
                        className="px-4 py-2.5 rounded-xl text-xs transition-all duration-200 border hover:opacity-80"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-chakra)', letterSpacing: '0.06em' }}
                      >
                        ILLIMITÉ
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Animes */}
        <div className="anim-fade-up" style={{ animationDelay: '0.45s' }}>
          <p className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-chakra)' }}>
            Univers disponibles
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {ANIMES.map(name => (
              <span key={name} className="px-3 py-1.5 rounded-full text-xs border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-chakra)', letterSpacing: '0.04em' }}>
                {name}
              </span>
            ))}
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
