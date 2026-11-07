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
      siteKeySet: Boolean(cloudflare.turnstile.siteKey),
      secretKeySet: Boolean(cloudflare.turnstile.secretKey),
      publicSiteKeySet: Boolean(process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY),
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
    environment: config.isProd ? "production" : "development",
  };

  // Warn if there's a mismatch
  if (turnstileConfigured && !status.turnstile.keysMatch) {
    status.turnstile.warning = "Site key and public site key do not match.";
  }
  if (turnstileConfigured && !status.turnstile.publicSiteKeySet) {
    status.turnstile.warning = "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is not set.";
  }

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
