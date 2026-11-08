/**
 * Cloudflare configuration for MIC TECH.
 *
 * All values are optional. R2 is an optional media store alternative to Cloudinary/local uploads.
 */

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export const cloudflare = {
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

export function isR2Configured() {
  return cloudflare.r2.enabled;
}
