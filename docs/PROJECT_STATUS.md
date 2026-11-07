# MIC TECH — Project status

**Last verified:** 2026-11-07 (Asia/Karachi)
**Verification level:** `npm run lint` and `npm run build` pass. Runtime smoke checks were
limited after the dark-theme switch; see “Not verified” below.

## What works

### Public site (dark editorial theme)
- Homepage with lead story, breaking ticker, latest news, desks, most-read, newsletter.
- Article pages with structured blocks (paragraph, rich text, image, gallery, video, PDF,
  document, quote, highlight, link, embed, divider), reading progress, share rail, related
  stories, likes/bookmarks, comments and reports.
- Category, tag, search and Urdu desk pages. Urdu article cards render RTL with the
  Nastaliq font.
- Auth pages: sign up, sign in, forgot/reset password, email verification.
- Reader account: overview, bookmarks, comments, profile, password, delete account.
- Static/legal pages: about, contact, privacy, terms, editorial standards, community
  guidelines, corrections.
- Branded 404, client error boundary and maintenance screen.
- SEO: canonical metadata, Open Graph/Twitter cards, dynamic OG image route, NewsArticle and
  Breadcrumb JSON-LD, sitemap, robots, RSS.
- Security headers and a cheap admin presence gate in `middleware.js`.
- First-party analytics tracking (unique visitor cookie, bot filtering, no fake numbers).

### Admin newsroom
- Single admin login with optional TOTP MFA.
- Dashboard, audience analytics (date presets/custom, visitors vs pageviews, engagement,
  registrations, trend, realtime, sources, devices, geography, categories, paths, top stories).
- Article list, block editor, media picker, preview, publish now, schedule, unpublish/archive.
- Categories, media library, comment moderation, reports, readers, newsletter, settings, audit log.
- All admin APIs require an admin session and write audit entries for mutations.

### Platform
- MongoDB Atlas when `MONGODB_URI` is set; atomic local JSON store at `.data/db.json` otherwise.
- scrypt passwords, signed HttpOnly cookies, rate limiting, server-side validation, upload
  checks, audit logging.
- Seed script with 10 categories, demo editorial content (English + Urdu), admin account and
  a development-only demo reader.

## Design system
Premium Editorial Gold, now delivered as a **dark editorial theme**:
Midnight Black `#151515`, page black `#0f0f0e`, dark surfaces `#1a1917` / `#23221e`,
Pure White / Warm Ivory text `#f5f2ea`, Champagne Gold `#c5a24b`. Blue is never an accent.
Gold shimmer respects `prefers-reduced-motion`.

## Environment
- Development admin: `admin@mictech.news` / `MicTech@2026!` (development seed only).
- Demo reader: `reader@mictech.news` / `Reader@2026!` (never created in production).
- Local dev: `npm run dev` → http://localhost:3000.
- Required in production: `MONGODB_URI`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Not verified / known limitations
- Full manual cross-browser/device pass after the dark-theme change was not completed.
- Unit tests were not added; `npm test` currently has no test files.
- CSP allows inline scripts/styles because Next.js bootstrap scripts are not nonce-plumbed yet.
- Email delivery requires `RESEND_API_KEY`; without it links are logged server-side in development.
- Media uses Cloudinary when configured; otherwise local `public/uploads` (not durable on serverless).
- No production deployment, DNS or paid service has been configured.
- The original MIC TECH logo was not supplied; the wordmark is interim (see `DECISIONS.md` D-003).
