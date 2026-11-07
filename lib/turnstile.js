/**
 * Cloudflare Turnstile server-side verification.
 *
 * Verifies a Turnstile token by calling Cloudflare's /siteverify endpoint.
 * When Turnstile is not configured (no secret key), verification passes in
 * development so local work continues without credentials. In production,
 * an unconfigured Turnstile fails closed (requests are rejected).
 */

import { config } from "@/lib/config";
import { isTurnstileConfigured } from "@/lib/cloudflare";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token, request = null) {
  const ip =
    request?.headers?.get("cf-connecting-ip") ||
    request?.headers?.get("x-real-ip") ||
    undefined;

  // Not configured: bypass in dev, fail closed in production.
  if (!isTurnstileConfigured()) {
    if (config.isProd) {
      return { success: false, error: "bot_protection_not_configured" };
    }
    return { success: true, skipped: true };
  }

  if (!token || typeof token !== "string") {
    return { success: false, error: "missing_token" };
  }

  try {
    const form = new URLSearchParams();
    form.set("secret", config.cloudflare.turnstile.secretKey);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    const result = (await response.json().catch(() => ({}))) || {};
    return {
      success: result.success === true,
      error: result.success ? undefined : result["error-codes"]?.join(",") || "verification_failed",
      challenge_ts: result.challenge_ts,
      hostname: result.hostname,
    };
  } catch (error) {
    console.error("[turnstile] verification error:", error?.message);
    return { success: false, error: "verification_error" };
  }
}

export function turnstileHtml(siteKey = "") {
  if (!siteKey) return "";
  return `
    <div class="cf-turnstile" data-sitekey="${siteKey}" data-callback="onTurnstileVerify"></div>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
  `;
}
