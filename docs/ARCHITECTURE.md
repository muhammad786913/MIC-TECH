# MIC TECH — Architecture

## Stack
- Next.js App Router (16.x), React 19, JavaScript only (no TypeScript).
- Tailwind CSS v4 with tokens in `app/globals.css`.
- MongoDB Atlas in production via the `mongodb` driver; atomic JSON store in development.
- `jose` for signed session cookies, Node `crypto` for scrypt and TOTP.

## Layout
```
app/
  (site)/          public site + reader account (shared header/footer)
  admin/           admin login and (dashboard) route group
  api/             route handlers (auth, admin, public, cron, health)
  layout.js        root fonts, metadata, analytics tracker
  sitemap.js robots.js rss.xml/ og/
components/
  public/ admin/ account/ auth/ brand/ ui/
lib/
  db/              driver abstraction + JSON store
  data/            settings, articles, categories, users, engagement,
                   comments, analytics, media
  auth/            password, session, TOTP, guards
  api.js           JSON helpers, mutation guard, rate limit, auth checks
  content.js       block validation/normalisation
  seo.js           metadata, JSON-LD, OG helpers
  validation.js    server-side input validation
middleware.js      security headers, maintenance gate, admin presence gate
scripts/seed.mjs   idempotent demo seed
```

## Data flow
1. Server components call `lib/data/*`; components never touch the database.
2. Mutations go through `app/api/**`, validate on the server, check the session and role,
   then write through `lib/data/*`.
3. Every admin mutation writes to the audit collection.
4. Analytics events are collected first-party at `/api/analytics/collect` with a random
   HttpOnly visitor cookie; bot user agents are discarded.

## Rendering
- Public routes force dynamic rendering so the build never needs a database connection.
- Admin and account routes are dynamic and guarded server-side.
- Static assets and editorial illustrations live under `public/`.

## Content model
Articles store structured JSON blocks, never raw HTML. `lib/content.js` normalises and
validates every block type. Publication status is one of `draft`, `scheduled`, `published`,
`archived`; soft deletes use `deletedAt`.
