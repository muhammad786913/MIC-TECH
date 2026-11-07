# AGENTS.md — MIC TECH

Global instructions for every AI agent or human contributor working on MIC TECH.

## 1. Project

MIC TECH is a premium digital news publishing platform and CMS.

- Workspace root: `C:\Users\ALI\Desktop\MIC TECH`
- Application: `my-app/`
- Brand: **Premium Editorial Gold** — Midnight Black `#151515`, Pure White `#FFFFFF`,
  Champagne Gold `#C5A24B`, Warm Ivory `#F5F2EA`. Blue is never a brand/UI accent.

## 2. Mandatory reading order

1. `docs/AGENT_TASKS.md` — current status and handover notes.
2. `AGENTS.md` — this file.
3. `docs/PROJECT_STATUS.md` — what actually works.
4. `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SECURITY.md`.
5. Relevant source before editing.

## 3. Task tracking (mandatory)

Before any implementation change:

1. Add a task entry to `docs/AGENT_TASKS.md` with a unique ID (`MIC-nnn`).
2. Set status `IN_PROGRESS`, record date/time, objective, planned steps and affected areas.
3. Update the entry when scope, decisions, blockers or stages change.
4. Mark `DONE` only after honest verification. Record summary, files, packages,
   database changes, tests, build result, remaining issues.
5. Use `BLOCKED` / `PAUSED` with a concrete next action when interrupted.

Never mark incomplete work as complete. Never rewrite another agent's history — append.

## 4. Technology rules

- Next.js App Router (current stable in repo), **JavaScript only — no TypeScript**.
- React Server Components by default; `"use client"` only where interaction requires it.
- Tailwind CSS v4 (repo already configured) + shared design tokens in `app/globals.css`.
- Node.js runtime for all routes that touch the database, crypto, or filesystem.
- MongoDB Atlas in production through the repository layer (`lib/db`).
  Local development falls back to a JSON store in `.data/` when `MONGODB_URI` is absent.
- Cloud storage: Cloudinary when configured; local `public/uploads` for development only.
- No Blue accent colours. No mock statistics in production.
- Prefer Route Handlers (`app/api/**`) over separate backend services.

## 5. Coding conventions

- Path alias `@/` → application root.
- Server data access in `lib/data/*`; shared pure helpers in `lib/*`; no DB calls in components.
- Validate and authorise **on the server** for every mutation. Client checks are UX only.
- Store dates as ISO-8601 strings in the data layer.
- All user-entered strings are escaped by React; never use `dangerouslySetInnerHTML` with
  untrusted content. The rich-text renderer uses an allowlist and escapes first.
- Centralised spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 px (Tailwind `1,2,3,4,6,8,12,16`).
- Semantic HTML, one `h1` per page, visible focus states, WCAG 2.2 AA targets.
- Respect `prefers-reduced-motion` for all animation, including gold shimmer.

## 6. Development permissions

The agent may autonomously: create/modify/refactor files, install compatible packages,
run scripts/builds/tests/dev servers, add routes/models/components, fix bugs, improve
architecture, create docs, optimise performance, and generate project assets.

Still requires explicit authorisation: production deployment, paid services, DNS changes,
public publishing, irreversible production data deletion.

Never destroy uncommitted user work. Inspect before overwriting. Back up before risky
schema/data operations. Never commit secrets. Do not bypass OS/IDE security controls.

## 7. Security rules

- Secrets only in `.env.local` / deployment secret stores. Never log or document them.
- Passwords: scrypt (Node `crypto`) with per-password salt; never reversible storage.
- Sessions: signed HttpOnly, SameSite=Lax cookies (JWT via `jose`), short-lived admin sessions.
- Admin MFA: TOTP (RFC 6238), available in Admin → Settings → Security.
- Authorise every admin API with a server-side session + role check + active-user check.
- Mutations require same-origin `Origin` and JSON content type; cookies are SameSite=Lax.
- Rate-limit auth, comments, uploads, analytics and reports (`lib/rate-limit.js`).
- Validate uploads by MIME allowlist, extension, magic bytes and size.
- Escape output; validate URLs (`http`, `https`, relative only); reject `$`-prefixed keys.
- Do not weaken CSP/headers to make a feature work without documenting the reason.

## 8. Testing expectations

- Run `npm run lint`, `npm test`, and `npm run build` after meaningful changes.
- Add unit tests for new pure logic and integration checks for critical flows.
- Manually verify public, admin and auth flows when UI changes.
- Report verification honestly, including what was not tested.

## 9. Documentation

Update as relevant: `docs/PROJECT_STATUS.md`, `docs/PROGRESS.md`, `CHANGELOG.md`,
`docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/AGENT_TASKS.md`.
Keep docs concise and accurate. No secrets in docs.

## 10. Commands

```bash
cd my-app
npm install
npm run dev          # http://localhost:3000
npm run seed         # categories, settings, admin, demo content (dev)
npm run seed -- --reset
npm run lint
npm test
npm run build
npm start
```

Environment template: `my-app/.env.example`. First-run admin credentials are printed by
the seed script; in production `ADMIN_EMAIL` and `ADMIN_PASSWORD` are required.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
