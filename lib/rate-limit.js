/** Fixed-window in-process rate limiter. Single-instance only — see docs/SECURITY.md. */

const registry =
  globalThis.__micRateLimits || (globalThis.__micRateLimits = new Map());

let lastSweep = Date.now();

function sweep(now) {
  if (now - lastSweep < 120_000) return;
  lastSweep = now;
  for (const [key, entry] of registry) {
    if (entry.resetAt <= now) registry.delete(key);
  }
}

export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  sweep(now);
  const entry = registry.get(key);
  if (!entry || entry.resetAt <= now) {
    registry.set(key, { count: 1, resetAt: now + windowMs });
    return {
      ok: true,
      remaining: limit - 1,
      retryAfter: Math.ceil(windowMs / 1000),
      resetAt: now + windowMs,
    };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      resetAt: entry.resetAt,
    };
  }
  return {
    ok: true,
    remaining: limit - entry.count,
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    resetAt: entry.resetAt,
  };
}

export function resetRateLimit(key) {
  registry.delete(key);
}

export function clientIp(request) {
  const headers = request?.headers;
  if (!headers) return "127.0.0.1";
  const value =
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    (headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "127.0.0.1";
  return String(value).slice(0, 64);
}

export function rateLimitKey(prefix, request, suffix = "") {
  return `${prefix}:${clientIp(request)}${suffix ? `:${suffix}` : ""}`;
}
