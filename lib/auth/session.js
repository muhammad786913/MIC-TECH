/** Signed, HttpOnly session cookies. */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_TTL_SECONDS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  config,
  getSessionSecret,
} from "@/lib/config";

export async function signSession(payload, ttlSeconds = SESSION_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setIssuer("mic-tech")
    .setAudience("mic-tech")
    .setExpirationTime(now + ttlSeconds)
    .sign(getSessionSecret());
}

export async function verifySession(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: "mic-tech",
      audience: "mic-tech",
      clockTolerance: 10,
    });
    if (!payload?.sub || !["admin", "user"].includes(payload.role)) return null;
    return {
      sub: String(payload.sub),
      role: payload.role,
      name: payload.name || "",
      email: payload.email || "",
      sv: Number(payload.sv || 0),
      mfa: Boolean(payload.mfa),
    };
  } catch {
    return null;
  }
}

export function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    path: "/",
    maxAge,
  };
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function setSessionCookie(response, payload, { admin = false } = {}) {
  const ttl = admin ? ADMIN_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS;
  const token = await signSession(payload, ttl);
  response.cookies.set(SESSION_COOKIE, token, cookieOptions(ttl));
  return token;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  return response;
}

export function sessionFromRequest(request) {
  return verifySession(request?.cookies?.get?.(SESSION_COOKIE)?.value);
}
