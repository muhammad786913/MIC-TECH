import { NextResponse } from "next/server";
import { isR2Configured, cloudflare } from "@/lib/cloudflare";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const r2Configured = isR2Configured();

  const status = {
    ok: true,
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

  if (!status.cloudflareProxy && config.isProd) {
    status.cloudflareProxyWarning =
      "CLOUDFLARE_PROXIED is not set to 'true'. cf-connecting-ip header may not be trusted.";
  }

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
