import { NextResponse } from "next/server";

/**
 * Edge middleware: security headers, maintenance gate, admin gate, and
 * Cloudflare compatibility.
 *
 * - Security headers (CSP, HSTS, X-Frame-Options, etc.) applied to every response.
 * - Maintenance gate via env `MAINTENANCE_MODE=true` (edge) and/or DB setting.
 * - Admin presence gate redirects unauthenticated /admin* to /admin/login.
 * - Cloudflare compatibility: trusts cf-connecting-ip, logs CF-Ray, allows
 *   Turnstile challenge domains in CSP, sends WAF-friendly headers.
 */

const SESSION_COOKIE = "mic_session";
const MAINTENANCE_PATHS = ["/maintenance"];
const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest|woff2?)$/i;

// Cloudflare Turnstile domains allowed in CSP for the widget script.
const TURNSTILE_DOMAINS = [
  "https://challenges.cloudflare.com",
  "https://cloudflareinsights.com",
];

function isMaintenance() {
  return String(process.env.MAINTENANCE_MODE || "").toLowerCase() === "true";
}

function securityHeaders(response, request) {
  const isProd = process.env.NODE_ENV === "production";
  const cfRay = request.headers.get("cf-ray") || "";

  // Build CSP directives as key-value pairs to avoid duplicates.
  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...TURNSTILE_DOMAINS],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://challenges.cloudflare.com"],
    "media-src": ["'self'", "https:"],
    "frame-src": [
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://player.vimeo.com",
      "https://challenges.cloudflare.com",
    ],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  // Add R2 endpoint to connect-src when configured so media uploads work through CF.
  if (process.env.CLOUDFLARE_R2_ACCOUNT_ID) {
    cspDirectives["connect-src"].push(
      `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    );
  }

  if (isProd) {
    cspDirectives["default-src"].push("upgrade-insecure-requests");
  }

  const csp = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  // WAF compatibility: echo CF-Ray for debugging and correlation.
  if (cfRay) {
    response.headers.set("X-CF-Ray", cfRay);
  }

  // Trust Cloudflare IP headers when proxied (orange cloud). The app already
  // reads cf-connecting-ip for rate limiting and analytics.
  if (process.env.CLOUDFLARE_PROXIED === "true") {
    response.headers.set("X-Forwarded-Proto", "https");
  }

  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // Reporting endpoint for CSP violations (optional, collected by CF Logpush).
  response.headers.set(
    "Report-To",
    '{"group":"csp","max_age":86400,"endpoints":[{"url":"/api/csp-report"}]}',
  );

  if (!request.nextUrl.pathname.startsWith("/_next/")) {
    response.headers.set("Vary", "Accept-Encoding");
  }
  return response;
}

function isAsset(pathname) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    PUBLIC_FILE.test(pathname)
  );
}

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // Maintenance gate. Admin and health endpoints stay reachable so the newsroom
  // can turn maintenance off and monitoring keeps working.
  if (
    isMaintenance() &&
    !isAsset(pathname) &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !MAINTENANCE_PATHS.includes(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return securityHeaders(NextResponse.rewrite(url), request);
  }

  // Cheap admin presence gate. Real authorisation is enforced by the server.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return securityHeaders(NextResponse.redirect(url), request);
    }
  }

  return securityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
