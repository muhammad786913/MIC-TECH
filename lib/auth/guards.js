/** Server-side authorisation helpers used by pages and route handlers. */
import { redirect } from "next/navigation";
import { db, ensureDb } from "@/lib/db/store";
import { getSession, sessionFromRequest } from "./session";

export function sanitizeUser(user) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    role: user.role || "user",
    emailVerified: Boolean(user.emailVerified),
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    notificationPrefs: user.notificationPrefs || {},
    mfaEnabled: Boolean(user.mfaEnabled),
    createdAt: user.createdAt,
  };
}

export async function resolveSession(session) {
  if (!session?.sub) return null;
  await ensureDb();
  const user = await db.collection("users").findOne({ _id: session.sub });
  if (!user) return null;
  if (user.disabled || user.deletedAt) return null;
  if (Number(user.sessionVersion || 0) !== Number(session.sv || 0)) return null;
  if (user.role !== session.role) return null;
  return user;
}

export async function getCurrentUser() {
  const session = await getSession();
  const user = await resolveSession(session);
  return sanitizeUser(user);
}

export async function getRequestUser(request) {
  const session = await sessionFromRequest(request);
  const user = await resolveSession(session);
  return sanitizeUser(user);
}

/** Full record (server-only) — never return this directly. */
export async function getRequestUserRecord(request) {
  const session = await sessionFromRequest(request);
  return resolveSession(session);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin/login?error=forbidden");
  return user;
}
