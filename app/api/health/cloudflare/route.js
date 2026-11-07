import { NextResponse } from "next/server";
import { isTurnstileConfigured, isR2Configured, cloudflare } from "@/lib/cloudflare";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const turnstileConfigured = isTurnstileConfigured();
  const r2Configured = isR2Configured();

    const status = {
    ok: true,
    turnstile: {
      configured: turnstileConfigured,
      // siteKey reads from NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY (preferred) or CLOUDFLARE_TURNSTILE_SITE_KEY
      siteKeySet: Boolean(cloudflare.turnstile.siteKey),
      secretKeySet: Boolean(cloudflare.turnstile.secretKey),
      // Explicitly report the public env var state
      publicSiteKeySet: Boolean(process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY),
      // Keys match when the server-side site key equals the public site key
      keysMatch:
        cloudflare.turnstile.siteKey &&
        cloudflare.turnstile.siteKey === process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
      mode: turnstileConfigured ? "active" : config.isProd ? "fail-closed" : "dev-bypass",
    },
    r2: {
      configured: r2Configured,
      accountIdSet: Boolean(cloudflare.r2.accountId),
      bucketName: cloudflare.r2.bucketName,
      publicUrlSet: Boolean(cloudflare.r2.publicUrl),
    },
    cloudflareProxy: cloudflare.proxied,
    cloudflareProxyEnvSet: process.env.CLOUDFLARE_PROXIED === "true",
    environment: config.isProd ? "production" : "development",
  };

  // Warn if there's a mismatch
  if (status.turnstile.siteKeySet && !status.turnstile.keysMatch) {
    status.turnstile.warning =
      "Site key and public site key do not match. Ensure CLOUDFLARE_TURNSTILE_SITE_KEY and NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY have the same value.";
  }
  if (status.turnstile.publicSiteKeySet && !status.turnstile.siteKeySet) {
    status.turnstile.warning =
      "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is set but CLOUDFLARE_TURNSTILE_SITE_KEY is not. The server will now use the public key as fallback.";
  }
  if (!status.turnstile.siteKeySet && !status.turnstile.publicSiteKeySet) {
    status.turnstile.warning =
      "No Turnstile site key found. Set NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY (and CLOUDFLARE_TURNSTILE_SECRET_KEY for production).";
  }
  if (!status.turnstile.secretKeySet && config.isProd) {
    status.turnstile.warning =
      (status.turnstile.warning ? status.turnstile.warning + " " : "") +
      "CLOUDFLARE_TURNSTILE_SECRET_KEY is not set. Turnstile will fail closed in production.";
  }
  if (!status.cloudflareProxy && config.isProd) {
    status.cloudflareProxyWarning =
      "CLOUDFLARE_PROXIED is not set to 'true'. cf-connecting-ip header may not be trusted.";
  }

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
