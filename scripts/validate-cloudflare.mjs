#!/usr/bin/env node
/**
 * Cloudflare setup validation script for MIC TECH.
 *
 * Validates that all Cloudflare-related environment variables are present
 * and that the application is configured correctly for Cloudflare integration.
 * Does NOT expose or log any secret values.
 *
 * Reads .env.local if present, then falls back to process.env.
 */

import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const env = { ...process.env };
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocal)) {
    const lines = fs.readFileSync(envLocal, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes.
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

const env = loadEnv();
const isProd = env.NODE_ENV === "production";

const errors = [];
const warnings = [];
const info = [];

// --- Turnstile checks ---
const secretKey = env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "";
const siteKey = env.CLOUDFLARE_TURNSTILE_SITE_KEY || "";
const publicSiteKey = env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "";

if (secretKey && siteKey) {
  info.push("[OK] Turnstile: both secret key and site key are configured.");
} else if (secretKey || siteKey) {
  errors.push("[FAIL] Turnstile: only one of secret key / site key is set. Both are required.");
} else if (isProd) {
  errors.push("[FAIL] Turnstile: not configured in production. Bot protection will fail closed.");
} else {
  warnings.push("[INFO] Turnstile: not configured. Dev mode will auto-bypass verification.");
}

if (siteKey && publicSiteKey && siteKey !== publicSiteKey) {
  errors.push("[FAIL] Turnstile: CLOUDFLARE_TURNSTILE_SITE_KEY and NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY do not match.");
} else if (siteKey && !publicSiteKey) {
  errors.push("[FAIL] Turnstile: NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is missing (needed by client components).");
}

// --- R2 checks ---
const r2AccountId = env.CLOUDFLARE_R2_ACCOUNT_ID || "";
const r2AccessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const r2SecretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const r2BucketName = env.CLOUDFLARE_R2_BUCKET_NAME || "";
const r2PublicUrl = env.CLOUDFLARE_R2_PUBLIC_URL || "";

const r2Configured = Boolean(r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName);
const r2Partial = Boolean(r2AccountId || r2AccessKeyId || r2SecretAccessKey || r2BucketName);

if (r2Configured) {
  info.push("[OK] R2: all credentials configured.");
  if (!r2PublicUrl) {
    warnings.push("[WARN] R2: CLOUDFLARE_R2_PUBLIC_URL is not set. Media URLs will use the default R2 endpoint.");
  }
} else if (r2Partial) {
  errors.push("[FAIL] R2: only some R2 credentials are set. All four are required (accountId, accessKeyId, secretAccessKey, bucketName).");
} else {
  info.push("[INFO] R2: not configured. Media will use Cloudinary or local storage.");
}

// --- Cloudflare proxy check ---
if (String(env.CLOUDFLARE_PROXIED || "").toLowerCase() === "true") {
  info.push("[OK] Cloudflare proxy: enabled (orange cloud). cf-connecting-ip will be trusted.");
} else {
  warnings.push("[WARN] Cloudflare proxy: not enabled. Set CLOUDFLARE_PROXIED=true when your domain is orange-cloud proxied.");
}

// --- Production-specific checks ---
if (isProd) {
  if (!env.SESSION_SECRET) {
    errors.push("[FAIL] SESSION_SECRET is missing in production.");
  }
  if (!env.MONGODB_URI) {
    errors.push("[FAIL] MONGODB_URI is missing in production (JSON store is dev-only).");
  }
  if (!env.NEXT_PUBLIC_SITE_URL) {
    errors.push("[FAIL] NEXT_PUBLIC_SITE_URL is missing in production.");
  }
}

// --- Report ---
let failed = false;
console.log("\n========================================");
console.log("  MIC TECH — Cloudflare Setup Validation");
console.log("========================================");

if (info.length) {
  console.log("\n✓ PASS:");
  info.forEach((i) => console.log(`   ${i}`));
}

if (warnings.length) {
  console.log("\n⚠ WARNINGS:");
  warnings.forEach((w) => console.log(`   ${w}`));
}

if (errors.length) {
  failed = true;
  console.log("\n✗ ERRORS:");
  errors.forEach((e) => console.log(`   ${e}`));
}

console.log("\n========================================");
if (failed) {
  console.log("  Result: FAILURE — fix errors before deploying to production.");
  process.exit(1);
} else {
  console.log("  Result: SUCCESS — Cloudflare integration is ready.");
}
process.exit(0);
