/** Route-handler utilities: JSON responses, errors, origin checks, rate limits, guards. */
import { NextResponse } from "next/server";
import { ValidationError, httpError, plainObject } from "@/lib/validation";
import { getRequestUserRecord, sanitizeUser } from "@/lib/auth/guards";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { config } from "@/lib/config";

export function json(data, status = 200, headers = {}) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export function fail(message, status = 400, extra = {}) {
  return json({ ok: false, error: message, ...extra }, status);
}

export function handleError(error, context = "api") {
  if (error instanceof ValidationError || error?.status) {
    return fail(error.message || "Invalid request.", error.status || 400, {
      fields: error.fields,
    });
  }
  console.error(`[${context}]`, error?.stack || error);
  return fail("Something went wrong. Please try again.", 500);
}

export async function readJson(request, { maxBytes = 1_000_000 } = {}) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw httpError(415, "Expected a JSON request body.");
  }
  const raw = await request.text();
  if (raw.length > maxBytes) throw httpError(413, "Request body is too large.");
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw httpError(400, "Invalid JSON.");
  }
  return plainObject(payload);
}

export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // SameSite cookies + JSON content-type remain enforced.
  try {
    const originHost = new URL(origin).host;
    const requestHost = request.headers.get("host");
    if (!requestHost) return false;
    if (originHost === requestHost) return true;
    if (config.siteUrl) {
      const configured = new URL(config.siteUrl);
      if (configured.host === originHost) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function guardMutation(request) {
  if (!sameOrigin(request)) throw httpError(403, "Cross-site request blocked.");
}

export function limit(request, prefix, { max = 20, windowMs = 60_000, scope = "" } = {}) {
  const result = rateLimit(rateLimitKey(prefix, request, scope), {
    limit: max,
    windowMs,
  });
  if (!result.ok) {
    const error = httpError(429, "Too many attempts. Please wait and try again.");
    error.retryAfter = result.retryAfter;
    throw error;
  }
  return result;
}

export async function apiUser(request) {
  const user = await getRequestUserRecord(request);
  return sanitizeUser(user);
}

export async function requireApiUser(request) {
  const user = await getRequestUserRecord(request);
  if (!user) throw httpError(401, "Please sign in to continue.");
  return user;
}

export async function requireApiAdmin(request) {
  const user = await getRequestUserRecord(request);
  if (!user || user.role !== "admin") {
    throw httpError(401, "Administrator access required.");
  }
  return user;
}

export function tooMany(error) {
  return json(
    { ok: false, error: error.message },
    429,
    { "Retry-After": String(error.retryAfter || 60) },
  );
}

export function methodNotAllowed(allow = []) {
  return json(
    { ok: false, error: "Method not allowed." },
    405,
    { Allow: allow.join(", ") },
  );
}

export function bearerAuthorised(request, secret) {
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export function requestMeta(request) {
  return {
    ip: request?.headers?.get("cf-connecting-ip") || "",
    country: request?.headers?.get("cf-ipcountry") || "",
  };
}
