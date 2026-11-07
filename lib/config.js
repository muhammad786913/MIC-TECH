/**
 * Central runtime configuration. Never import secrets into client components.
 */

const isProd = process.env.NODE_ENV === "production";

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export const config = {
  isProd,
  siteUrl: trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  siteName: "MIC TECH",
  siteTagline: "Precision. Perspective. Pakistan.",
  defaultDescription:
    "MIC TECH delivers independent reporting and analysis on Pakistan, world affairs, technology, business and culture.",
  sessionSecret: process.env.SESSION_SECRET || "",
  dbDriver:
    process.env.DB_DRIVER || (process.env.MONGODB_URI ? "mongo" : "json"),
  mongoUri: process.env.MONGODB_URI || "",
  mongoDb: process.env.MONGO_DB || process.env.MONGODB_DB || "mictech",
  cronSecret: process.env.CRON_SECRET || "",
  exposeDevLinks:
    process.env.EXPOSE_DEV_LINKS === "true" ||
    (!isProd && process.env.EXPOSE_DEV_LINKS !== "false"),
  emailVerificationRequired:
    process.env.EMAIL_VERIFICATION_REQUIRED === "true",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "mictech",
  },
  mail: {
    resendKey: process.env.RESEND_API_KEY || "",
    from: process.env.MAIL_FROM || "MIC TECH <no-reply@mictech.news>",
  },
  cloudflare: {
    turnstile: {
      secretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "",
      siteKey: process.env.CLOUDFLARE_TURNSTILE_SITE_KEY || "",
    },
    r2: {
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID || "",
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || "mictech-media",
      publicUrl: trimSlash(process.env.CLOUDFLARE_R2_PUBLIC_URL || ""),
    },
  },
};

// Client-safe Cloudflare values (no secrets). Safe to import in client components.
export const cloudflarePublic = {
  turnstileSiteKey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "",
  r2PublicUrl: trimSlash(process.env.CLOUDFLARE_R2_PUBLIC_URL || ""),
};

export function getSessionSecret() {
  if (config.sessionSecret) {
    return new TextEncoder().encode(config.sessionSecret);
  }
  if (config.isProd) {
    throw new Error("SESSION_SECRET is required in production.");
  }
  // Stable development-only secret so sessions survive restarts.
  return new TextEncoder().encode(
    "mic-tech-development-only-secret-do-not-use-in-production-4f8c2a1b",
  );
}

export function assertProductionConfig() {
  const problems = [];
  if (!config.sessionSecret) problems.push("SESSION_SECRET is missing");
  if (!process.env.MONGODB_URI && config.isProd)
    problems.push("MONGODB_URI is missing (JSON store is development-only)");
  if (!process.env.NEXT_PUBLIC_SITE_URL && config.isProd)
    problems.push("NEXT_PUBLIC_SITE_URL is missing");
  return problems;
}

export const SESSION_COOKIE = "mic_session";
export const VISITOR_COOKIE = "mic_vid";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // public users: 7 days
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // admins: 8 hours
