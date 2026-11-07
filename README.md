# MIC TECH

Premium digital news publishing platform and CMS, built with Next.js App Router, React 19,
Tailwind CSS v4 and MongoDB Atlas (local JSON fallback for development). JavaScript only.

## Quick start

```bash
cd my-app
npm install
cp .env.example .env.local   # optional for local JSON development
npm run seed                 # demo categories, content, admin and reader (dev only)
npm run dev                  # http://localhost:3000
```

Development seed credentials are printed by `npm run seed`:

- Admin: `admin@mictech.news` / `MicTech@2026!` → `/admin/login`
- Reader: `reader@mictech.news` / `Reader@2026!` → `/login`

Never use these defaults in production. Production requires `MONGODB_URI`, `SESSION_SECRET`,
`NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm start        # start the production build
npm run lint     # ESLint
npm test         # Vitest (no test files added yet)
npm run seed     # idempotent demo seed
npm run seed:reset
```

## Structure

- `app/(site)` — public news site and reader account
- `app/admin` — single-admin newsroom CMS
- `app/api` — route handlers for auth, admin, reader and operations
- `lib/data` — data services; `lib/db` — MongoDB/JSON storage
- `lib/auth` — scrypt passwords, signed sessions, TOTP MFA
- `docs/` — architecture, decisions, security and task log

## Design

Dark editorial theme: page `#0f0f0e`, surfaces `#1a1917` / `#23221e`, ivory text `#f5f2ea`,
champagne gold `#c5a24b`. Blue is never an accent. Gold shimmer respects
`prefers-reduced-motion`.

## Documentation

Start with `AGENTS.md`, then `docs/AGENT_TASKS.md`, `docs/PROJECT_STATUS.md`,
`docs/ARCHITECTURE.md`, `docs/DECISIONS.md` and `docs/SECURITY.md`.
