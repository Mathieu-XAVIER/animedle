# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — breaking changes vs older versions, read `node_modules/next/dist/docs/` before assuming API shapes
- **Tailwind CSS v4** — CSS entry point is `@import "tailwindcss"`, config lives in `@theme` blocks inside `globals.css`, no `tailwind.config.ts`
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — PostgreSQL + auth
## Commands

```bash
npm run dev        # dev server (localhost:3000)
npm run build      # production build + type check
npm run lint       # ESLint
npx tsc --noEmit   # type-check only

# Import des personnages (scripts par anime)
npx tsx scripts/import-one-piece.ts [--no-anilist] [--limit N]
npx tsx scripts/import-snk.ts [--no-anilist]
npx tsx scripts/import-demon-slayer.ts [--no-anilist]
```

## Environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET_TOKEN=        # protège /admin et /api/admin/*
```

## Architecture

### Data flow

```
scripts/import-*.ts → characters (is_active=true) + character_aliases
                            ↓
               daily_challenges + game_sessions
```

### Supabase clients

- `src/lib/supabase/server.ts` — `createClient()` (anon, RSC/routes) · `createAdminClient()` (service role, admin routes)
- `src/lib/supabase/client.ts` — `createClient()` browser only
- **Service role is required** for all `/api/admin/*` routes and scripts

### Admin auth

Cookie HTTP-only `admin_token` comparé à `ADMIN_SECRET_TOKEN` dans `src/middleware.ts`. Toutes les routes `/admin` et `/api/admin/*` sont protégées. Pas de Supabase Auth.

### Game logic

- `src/lib/game/compare.ts` — `compareCharacters(guess, target)` retourne `GuessComparison` avec `correct | partial | wrong` par attribut. `partial` s'applique sur `faction`, `power_type`, `weapon_type` via tokenisation.
- `POST /api/game/guess` — **ne révèle jamais `character_id` cible avant que la partie soit terminée** (`is_correct || attempts >= 6`). Le mode illimité passe `targetCharacterId` dans le body au lieu de résoudre via `daily_challenges`.
- `GET /api/game/daily` — mise en cache jusqu'à minuit UTC (`secondsUntilMidnightUTC()`). Toutes les dates de défi sont en **UTC** (`getTodayUTC()` from `src/lib/utils/dates.ts`).

### Back-office

- `/admin/defis` — `DefiForm` (Client Component) : planification sur 14 jours par mode (`classique`, `citation`)

### Client hooks

- `useClassiqueGame(sessionId, targetCharacterId?)` — persiste l'état dans localStorage sous `classique_YYYY-MM-DD` (daily) ou `illimite_random-{id}` (illimité)
- `useCitationGame()` — persiste sous `citation_YYYY-MM-DD`

### Types

`src/types/database.ts` est **généré depuis Supabase** — ne pas modifier manuellement. Régénérer après toute migration :
```bash
# Via MCP Supabase (si connecté) : utiliser mcp__supabase__generate_typescript_types
# ou : npx supabase gen types typescript --project-id <ID> > src/types/database.ts
```

### Migrations SQL

`supabase/migrations/` — 9 fichiers numérotés (001–009). À appliquer dans l'ordre via MCP (`mcp__supabase__apply_migration`) ou le SQL Editor Supabase. Le seed des animes est dans `supabase/seed/animes_seed.sql`.

### Design system

CSS custom properties définies dans `src/app/globals.css` (`:root`) : `--bg`, `--surface`, `--card`, `--border`, `--accent`, `--correct`, `--partial`, `--wrong`, `--muted`. Fonts : `var(--font-chakra)` (Chakra Petch, display) + `var(--font-barlow)` (Barlow, body). Classes d'animation custom : `anim-fade-up`, `anim-glow`, `anim-blink`, `anim-slide-in`, `anim-float`.
