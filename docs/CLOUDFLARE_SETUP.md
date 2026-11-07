# MIC TECH — Cloudflare Setup Guide

This document walks you through every manual step needed to connect MIC TECH to Cloudflare.
All code changes are already committed. You only need to configure the Cloudflare dashboard
and set environment variables in your production host (Vercel).

## Prerequisites

- A Cloudflare account (free tier is sufficient for Turnstile + basic WAF).
- A domain registered and pointed at Cloudflare (or ready to be transferred).
- Vercel project for MIC TECH already deployed.

---

## Step 1: Add Your Domain to Cloudflare

**Where:** Cloudflare Dashboard → Websites → Add a site

1. Enter your domain (e.g. `mictech.news`).
2. Choose the **Free plan** (Turnstile and WAF are available on free).
3. Cloudflare will scan your existing DNS records. Review and confirm them.
4. Cloudflare will give you two nameservers (e.g. `iana.ns.cloudflare.com`, `odin.ns.cloudflare.com`).
5. **Log in to your domain registrar** and replace the domain's nameservers with the two Cloudflare nameservers.
6. Wait for propagation (usually 5–30 minutes, can take up to 24 hours).

> You cannot proceed to the remaining steps until the domain is active on Cloudflare.

---

## Step 2: Create a Turnstile Site (Bot Protection)

**Where:** Cloudflare Dashboard → Turnstile → Add site

1. Click **Add site**.
2. Enter a name (e.g. `MIC TECH`).
3. Choose the widget type:
   - **Managed** (recommended) — invisible to users, shows a challenge only when suspicious.
   - **Non-interactive** — fully invisible, no checkbox.
   - **Always-on** — always shows a checkbox.
4. Add your domain(s) to the allowed list (e.g. `mictech.news`, `www.mictech.news`).
5. Click **Create**.
6. Copy the **Site Key** (public) and **Secret Key** (private).

**Never commit the Secret Key.** Add it to your production environment only.

---

## Step 3: Create an R2 Bucket (Optional Media Storage)

R2 is an alternative to Cloudinary for storing uploaded media. Skip this step if you want to keep using Cloudinary or local uploads.

**Where:** Cloudflare Dashboard → R2 → Create bucket

1. Click **Create bucket**.
2. Enter a bucket name (e.g. `mictech-media`).
3. Choose a region closest to your users.
4. Click **Create bucket**.
5. Go to **R2 → Buckets → mictech-media → Settings** and configure:
   - **Public access:** Enable if you want media to be publicly readable via URL.
   - **Custom domain:** Optional — you can point a custom domain (e.g. `media.mictech.news`) at the bucket.
6. Go to **R2 → Manage R2 API tokens** → **Create API token**.
   - Copy the **Access Key ID** and **Secret Access Key**.
   - Copy your **Account ID** from the R2 dashboard URL.

---

## Step 4: Configure DNS Records (Orange Cloud)

**Where:** Cloudflare Dashboard → DNS → Records

For each record, ensure the proxy status is **Proxied (orange cloud)**:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `www` | `cname.vercel-dns.com` | ☁️ On |
| A | `@` | `76.76.21.21` (Vercel) | ☁️ On |

If you created an R2 custom domain (e.g. `media.mictech.news`):
| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `media` | `<your-r2-custom-domain>` | ☁️ On |

> Only orange-cloud proxied domains will send `cf-connecting-ip` and `cf-ray` headers that MIC TECH uses for rate limiting and WAF correlation.

---

## Step 5: Set Environment Variables

**Where:** Vercel Dashboard → Your MIC TECH project → Settings → Environment Variables

Add the following variables for **Production** (and Preview if desired):

### Required for Turnstile (bot protection)

| Variable | Value | Notes |
|----------|-------|-------|
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Your Turnstile secret key | **Secret** — never expose to browser |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Your Turnstile site key | Public — used in client components |

### Required for R2 (optional, only if using R2 media storage)

| Variable | Value | Notes |
|----------|-------|-------|
| `CLOUDFLARE_R2_ACCOUNT_ID` | Your Cloudflare account ID | |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 API token access key | |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 API token secret key | **Secret** |
| `CLOUDFLARE_R2_BUCKET_NAME` | `mictech-media` (or your bucket name) | |
| `CLOUDFLARE_R2_PUBLIC_URL` | `https://media.mictech.news` (if custom domain) | Optional |

### Required for Cloudflare proxy compatibility

| Variable | Value | Notes |
|----------|-------|-------|
| `CLOUDFLARE_PROXIED` | `true` | Set when your domain is orange-cloud proxied |

### Existing variables (do not change)

Keep all existing variables: `SESSION_SECRET`, `MONGODB_URI`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `CRON_SECRET`, `CLOUDINARY_*`, etc.

---

## Step 6: Redeploy Vercel

**Where:** Vercel Dashboard → Your MIC TECH project → Deployments

1. After adding environment variables, click **Redeploy** on the latest production deployment.
2. Wait for the build to complete.
3. Verify the site loads at your domain.

---

## Step 7: Enable WAF Rules (Recommended)

**Where:** Cloudflare Dashboard → WAF → Configure

Recommended rules for MIC TECH:

| Rule | Action | Notes |
|------|--------|-------|
| **Bot Fight Mode** | Enabled | Free, blocks automated bots |
| **Managed Rules** | Enabled | OWASP Top 10, SQLi, XSS protection |
| **Rate Limiting** | Custom | Limit `/api/auth/login`, `/api/auth/signup`, `/api/comments` to 10 req/min per IP |
| **Custom Rule** | Block | Block requests to `/admin*` from non-office IPs (optional) |

---

## Step 8: Configure Cache Rules (Optional)

**Where:** Cloudflare Dashboard → Caching → Configuration

MIC TECH already sends `Cache-Control` headers from Next.js. Cloudflare will respect them. Optional overrides:

| Path | Cache Level | Browser TTL | Edge TTL |
|------|-------------|-------------|----------|
| `/` | Cache Everything | 1 hour | 1 hour |
| `/news/*` | Cache Everything | 1 hour | 1 hour |
| `/category/*` | Cache Everything | 1 hour | 1 hour |
| `/account/*` | Bypass | 0 | 0 |
| `/admin/*` | Bypass | 0 | 0 |
| `/api/*` | Bypass | 0 | 0 |

---

## Step 9: Verify the Integration

After deployment, test the following:

1. **Homepage loads** — `https://your-domain.com/` should return 200 with dark theme.
2. **Turnstile appears** — On `/login`, `/signup`, and comment forms, you should see a Turnstile widget (or invisible verification if Managed/Non-interactive).
3. **Login works** — Submit credentials with Turnstile token; should succeed.
4. **Comment works** — Sign in, open an article, post a comment with Turnstile; should succeed.
5. **API rejects without Turnstile** — Use `curl` to POST to `/api/auth/login` without a `turnstileToken`; should return 403.
6. **Security headers** — Visit `https://your-domain.com/` and check response headers for `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-CF-Ray`.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Turnstile widget doesn't appear | Site key missing or mismatched | Check `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` matches `CLOUDFLARE_TURNSTILE_SITE_KEY` |
| Login returns 403 "bot_protection_not_configured" | Turnstile not configured in production | Add both Turnstile keys to production env vars |
| Media uploads fail | R2 credentials incomplete | Set all 4 R2 env vars or remove them to fall back to Cloudinary/local |
| Real IP shows as Cloudflare proxy | `CLOUDFLARE_PROXIED` not set | Set `CLOUDFLARE_PROXIED=true` in production |
| CSP blocks Turnstile script | Domain not in CSP | The middleware already includes `challenges.cloudflare.com`; redeploy |

---

## Files Changed (for reference)

### New files
- `lib/cloudflare.js` — Cloudflare configuration
- `lib/turnstile.js` — Turnstile server verification
- `components/ui/Turnstile.jsx` — Turnstile client widget
- `app/api/csp-report/route.js` — CSP violation endpoint
- `scripts/validate-cloudflare.mjs` — Setup validation script
- `vercel.json` — Vercel deployment config

### Modified files
- `lib/config.js` — Added cloudflare config sections
- `.env.example` — Documented Cloudflare env vars
- `middleware.js` — Enhanced CSP, CF-Ray, WAF compatibility
- `next.config.mjs` — Cache-control headers
- `lib/media.js` — R2 upload support
- `app/api/auth/signup/route.js` — Turnstile verification
- `app/api/auth/login/route.js` — Turnstile verification
- `app/api/auth/forgot/route.js` — Turnstile verification
- `app/api/admin/login/route.js` — Turnstile verification
- `app/api/comments/route.js` — Turnstile verification
- `components/auth/LoginForm.jsx` — Turnstile widget
- `components/auth/SignupForm.jsx` — Turnstile widget
- `components/auth/ForgotForm.jsx` — Turnstile widget
- `components/admin/AdminLoginForm.jsx` — Turnstile widget
- `components/public/Comments.jsx` — Turnstile widget

### New dependency
- `@aws-sdk/client-s3` — Required only when R2 is configured

---

## What Remains (Manual Steps Only)

The following cannot be automated — you must complete them in the Cloudflare and Vercel dashboards:

1. [ ] Add domain to Cloudflare and update nameservers at your registrar.
2. [ ] Create Turnstile site and copy Site Key + Secret Key.
3. [ ] (Optional) Create R2 bucket and API token.
4. [ ] Configure DNS records with orange-cloud proxy.
5. [ ] Set all environment variables in Vercel production settings.
6. [ ] Redeploy Vercel.
7. [ ] Enable WAF rules (Bot Fight Mode, Managed Rules, Rate Limiting).
8. [ ] Verify the live integration (login, signup, comments, headers).
