# MIC TECH — Architecture Decisions

Append-only record of significant technical decisions.

## D-001 — Next.js App Router with Route Handlers

**Date:** 2026-11-05 · **Status:** Accepted

Use Next.js 16 App Router, JavaScript only, with server components for reads and Route
Handlers for mutations. Avoids a second backend, keeps deployment simple, and keeps
authorisation next to the data. All DB-touching routes declare `runtime = "nodejs"` where
required (the default in the Node runtime for this project).

## D-002 — Driver-agnostic repository with MongoDB Atlas + JSON development fallback

**Date:** 2026-11-05 · **Status:** Accepted

`lib/db` exposes one small collection API (`find`, `findOne`, `insertOne`, `updateOne`,
`deleteOne`, `count`) with two adapters:

- **MongoDB adapter** using the official `mongodb` driver when `MONGODB_URI` is set
  (production/Atlas). Indexes are created on first connection.
- **JSON adapter** writing atomically to `.data/db.json` when no URI is configured.

Reason: the repository can be cloned and run with zero external accounts, while production
uses Atlas. The service layer performs validation so both adapters behave identically.
Mongoose is deliberately not used; the official driver is thinner and the data contracts are
validated in `lib/validation.js` / `lib/content.js`. Revisit if Mongoose hooks become valuable.

Trade-off: cross-collection aggregations are computed in application code for analytics.
This is acceptable for v1 (bounded ranges) and documented for scaling (see DEPLOYMENT).

## D-003 — Interim MIC TECH logo

**Date:** 2026-11-05 · **Status:** Accepted (pending official asset)

No original MIC TECH logo file existed in the workspace (only default Next.js SVGs). An
interim luxury wordmark + gold monogram was created in `public/brand/` and
`components/brand/Logo.jsx`. Replace with the owner's original asset when supplied; keep the
same layout box and colour roles so nothing else needs changing.

## D-004 — Custom signed-cookie authentication (no third-party auth provider)

**Date:** 2026-11-05 · **Status:** Accepted

Scrypt password hashing (Node crypto), HS256 JWT sessions signed with `jose`, HttpOnly +
SameSite=Lax cookies, session-version revocation, short admin sessions, TOTP MFA. Avoids an
external auth dependency and keeps the single-admin model explicit. Admin API calls re-check
the user in the database (role, active, session version), so a stolen cookie cannot outlive a
disabled account. Email verification/reset tokens are random, stored hashed, single-use.

## D-005 — Structured block content instead of raw HTML

**Date:** 2026-11-05 · **Status:** Accepted

Articles store an ordered array of typed blocks. Only a constrained inline syntax
(`**bold**`, `*italic*`, `[label](https://…)`, line breaks) is rendered by an escaping
renderer. No raw HTML is accepted from editors or users. This removes the main stored-XSS
surface and keeps rendering portable for future apps/RSS.

## D-006 — First-party, privacy-conscious analytics

**Date:** 2026-11-05 · **Status:** Accepted

Analytics are collected first-party at `/api/analytics/collect`. Anonymous visitors receive a
random HttpOnly `mic_vid` cookie; registered actions use an account-scoped identifier.
Unique visitors are distinct visitor IDs in the selected period — not “real people” and not
page views. No third-party trackers, no fingerprinting. IP addresses are used transiently for
rate limiting and are not stored on analytics events. Country/device come from edge headers
and user agent. Demo seed data never fabricates analytics events; production charts show only
real events.

## D-007 — Tailwind CSS v4 tokens, no dark mode

**Date:** 2026-11-05 · **Status:** Accepted

The premium editorial palette is the product identity. A global dark theme would fight the
black/ivory/gold art direction, so the UI is intentionally light with black editorial
surfaces. Brand tokens live in `app/globals.css` (`@theme`). Spacing follows the required
4→64 px scale using Tailwind’s default 4 px unit.

## D-008 — CSP staged with nonce + strict-dynamic

**Date:** 2026-11-05 · **Status:** Accepted

`middleware.js` emits a per-request nonce and a CSP using `strict-dynamic` for scripts,
`self` for styles/fonts/images (plus Cloudinary), and `frame-ancestors 'none'`. Development
adds `unsafe-eval` for the dev toolchain only. Remote media embeds are limited to an allowlist
(YouTube/Vimeo). Report-only is not used; issues are fixed rather than permanently weakened.

## D-009 — Background work: lazy publish + secured cron route

**Date:** 2026-11-05 · **Status:** Accepted

Scheduled articles are published lazily when lists are read (cheap, debounced) and by
`/api/cron/publish` (Bearer `CRON_SECRET`) from a platform scheduler. This avoids requiring a
worker for v1 while still supporting minute-level scheduling. Backup/uptime automation is
documented in `docs/DEPLOYMENT.md` and `docs/BACKUP_RECOVERY.md`.

## D-010 — Development-only local media and demo content

**Date:** 2026-11-05 · **Status:** Accepted

Without Cloudinary credentials uploads go to `public/uploads` and are clearly development-only
(serverless filesystems are ephemeral). The seed script requires explicit production
credentials and refuses to create a weak admin in production. Demo articles are seeded only by
an explicit command; they are never inserted automatically in production.
