/**
 * Cloudflare configuration for MIC TECH.
 *
 * All values are optional. When Turnstile keys are absent, verification is skipped
 * in development so local work continues without Cloudflare credentials.
 * R2 is an optional media store alternative to Cloudinary/local uploads.
 */

const isProd = process.env.NODE_ENV === "production";

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export const cloudflare = {
  isProd,
  // Turnstile bot protection
  turnstile: {
    // Secret key is always server-side only.
    secretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "",
    // Site key is public — prefer NEXT_PUBLIC_ prefix (used by client components),
    // fall back to the non-public variant for backward compatibility.
    siteKey:
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
      process.env.CLOUDFLARE_TURNSTILE_SITE_KEY ||
      "",
    // In development, allow bypass when no secret key is configured.
    bypassInDev: !isProd && !process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
  },
  // R2 object storage (optional media store)
  r2: {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID || "",
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || "mictech-media",
    publicUrl: trimSlash(process.env.CLOUDFLARE_R2_PUBLIC_URL || ""),
    enabled: Boolean(
      process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
        process.env.CLOUDFLARE_R2_BUCKET_NAME,
    ),
  },
  // Whether Cloudflare proxy (orange cloud) is in front of the app.
  proxied: String(process.env.CLOUDFLARE_PROXIED || "").toLowerCase() === "true",
};

export function isTurnstileConfigured() {
  return Boolean(cloudflare.turnstile.secretKey && cloudflare.turnstile.siteKey);
}

export function isR2Configured() {
  return cloudflare.r2.enabled;
}
