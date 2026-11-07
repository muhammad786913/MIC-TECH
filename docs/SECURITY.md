# MIC TECH — Security notes

## Implemented
- Passwords: scrypt with per-password salt (`lib/auth/password.js`). Timing-safe comparison.
- Sessions: signed HS256 JWT in an HttpOnly, SameSite=Lax cookie; reader sessions 7 days,
  admin sessions 8 hours. `SESSION_SECRET` is mandatory in production.
- Admin MFA: TOTP (RFC 6238) with a server-side secret and one-step setup flow.
- Authorisation: every admin API calls `requireApiAdmin`; reader APIs call `requireApiUser`.
  Admin pages are guarded by `requireAdmin()` in the dashboard layout.
- Mutations: same-origin `Origin` check plus JSON content-type via `guardMutation()`.
- Rate limiting: auth, comments, uploads, reports, engagement and analytics collection.
- Validation: `lib/validation.js` and `lib/content.js` reject malformed input, unsafe URLs,
  `$`-prefixed keys and oversized payloads.
- Uploads: MIME/extension allowlist, magic-byte checks and size limits.
- Output: React escaping plus an allowlisted rich-text renderer; no untrusted
  `dangerouslySetInnerHTML`.
- Audit: admin mutations are recorded in `auditLogs`.
- Headers: CSP, HSTS (production), `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  Referrer-Policy, Permissions-Policy, COOP.
- Admin presence gate in middleware; real verification remains server-side.

## Known trade-offs
- CSP currently permits `'unsafe-inline'` for scripts and styles because Next.js inline
  bootstrap scripts are not nonce-plumbed. Tighten with a nonce before a hard CSP audit.
- The development JSON store is not intended for production; production requires MongoDB.
- Local uploads are not durable on serverless hosts; use Cloudinary in production.
- No service can guarantee zero risk or zero downtime. Backups, monitoring and incident
  response still need to be configured with the hosting provider.

## Production checklist
1. Set `MONGODB_URI`, `MONGO_DB`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `CRON_SECRET`, mail and Cloudinary credentials in the host secret store.
2. Run `npm run seed` once with production credentials (it never creates demo readers).
3. Put Cloudflare (or equivalent) in front of the app; enable WAF, bot fight mode and rate
   limiting at the edge as a second layer.
4. Configure scheduled calls to `/api/cron/publish` with the `CRON_SECRET` bearer token.
5. Enable database backups and test a restore.
6. Serve over HTTPS only; HSTS is emitted in production.
