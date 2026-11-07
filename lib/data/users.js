/** Users: registration, authentication, profile, verification, password reset, MFA. */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db, ensureDb } from "@/lib/db/store";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ValidationError, bool, email as vEmail, httpError, password as vPassword, str, url } from "@/lib/validation";
import { isoNow, slugify } from "@/lib/utils";

const COLLECTION = "users";
const MAX_FAILED = 8;
const LOCK_MINUTES = 15;

function tokenHash(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function newToken() {
  return randomBytes(32).toString("hex");
}

async function uniqueUsername(base) {
  let candidate = slugify(base, "reader").slice(0, 24);
  if (candidate.length < 3) candidate = `reader-${candidate}`.slice(0, 24);
  let suffix = 2;
  while (await db.collection(COLLECTION).findOne({ username: candidate })) {
    candidate = `${slugify(base, "reader").slice(0, 20)}-${suffix}`;
    suffix += 1;
    if (suffix > 999) candidate = `reader-${randomBytes(3).toString("hex")}`;
  }
  return candidate;
}

export async function findUserByEmail(address) {
  await ensureDb();
  return db.collection(COLLECTION).findOne({ email: String(address || "").toLowerCase() });
}

export async function findUserByUsername(username) {
  await ensureDb();
  return db.collection(COLLECTION).findOne({ username: String(username || "") });
}

export async function getUserById(id) {
  await ensureDb();
  return db.collection(COLLECTION).findOne({ _id: String(id || "") });
}

export async function createUser({ name, userEmail, password, username }) {
  await ensureDb();
  const cleanName = str(name, "Name", { min: 2, max: 60 });
  const cleanEmail = vEmail(userEmail);
  const cleanPassword = vPassword(password);
  if (await findUserByEmail(cleanEmail)) {
    throw new ValidationError("An account with this email already exists.");
  }
  const finalUsername = username
    ? String(username).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24)
    : await uniqueUsername(cleanName || cleanEmail.split("@")[0]);
  if (finalUsername.length < 3)
    throw new ValidationError("Username must be at least 3 characters.");
  if (await findUserByUsername(finalUsername))
    throw new ValidationError("That username is taken.");

  const verificationToken = newToken();
  const now = isoNow();
  const user = {
    _id: randomUUID(),
    name: cleanName,
    email: cleanEmail,
    username: finalUsername,
    passwordHash: await hashPassword(cleanPassword),
    role: "user",
    emailVerified: false,
    verifyTokenHash: tokenHash(verificationToken),
    verifyExpires: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    disabled: false,
    deletedAt: null,
    failedLogins: 0,
    lockedUntil: null,
    sessionVersion: 0,
    bio: "",
    avatarUrl: "",
    notificationPrefs: { comments: true, replies: true, newsletter: false, product: false },
    mfaEnabled: false,
    mfaSecret: "",
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const created = await db.collection(COLLECTION).insertOne(user);
  return { user: created, verificationToken };
}

export async function authenticateUser({ identifier, password }) {
  await ensureDb();
  const value = String(identifier || "").trim().toLowerCase();
  if (!value || !password) throw httpError(401, "Invalid email or password.");
  const user = await db.collection(COLLECTION).findOne({
    $or: [{ email: value }, { username: value }],
  });
  if (!user || user.deletedAt || user.disabled) {
    // Equalise timing a little for unknown accounts.
    await verifyPassword(String(password), "scrypt$16384$8$1$00$00").catch(() => {});
    throw httpError(401, "Invalid email or password.");
  }
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    throw httpError(429, "Too many failed attempts. Please try again later.");
  }
  const valid = await verifyPassword(String(password), user.passwordHash);
  if (!valid) {
    const failedLogins = Number(user.failedLogins || 0) + 1;
    const patch = { failedLogins, updatedAt: isoNow() };
    if (failedLogins >= MAX_FAILED) {
      patch.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
      patch.failedLogins = 0;
    }
    await db.collection(COLLECTION).updateOne({ _id: user._id }, { $set: patch });
    throw httpError(401, "Invalid email or password.");
  }
  await db.collection(COLLECTION).updateOne(
    { _id: user._id },
    { $set: { failedLogins: 0, lockedUntil: null, lastLoginAt: isoNow(), updatedAt: isoNow() } },
  );
  return user;
}

export async function issueEmailVerification(user) {
  await ensureDb();
  const token = newToken();
  await db.collection(COLLECTION).updateOne(
    { _id: user._id },
    {
      $set: {
        verifyTokenHash: tokenHash(token),
        verifyExpires: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        updatedAt: isoNow(),
      },
    },
  );
  return token;
}

export async function verifyEmailToken(token) {
  await ensureDb();
  const hashed = tokenHash(token);
  const user = await db.collection(COLLECTION).findOne({
    verifyTokenHash: hashed,
    verifyExpires: { $gt: isoNow() },
  });
  if (!user) throw new ValidationError("This verification link is invalid or has expired.");
  const updated = await db.collection(COLLECTION).updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: true, verifyTokenHash: "", verifyExpires: null, updatedAt: isoNow() },
    },
  );
  return updated;
}

export async function requestPasswordReset(address) {
  await ensureDb();
  const user = await findUserByEmail(address);
  if (!user || user.deletedAt || user.disabled) return { sent: false, token: null, user: null };
  const token = newToken();
  await db.collection(COLLECTION).updateOne(
    { _id: user._id },
    {
      $set: {
        resetTokenHash: tokenHash(token),
        resetExpires: new Date(Date.now() + 3600 * 1000).toISOString(),
        updatedAt: isoNow(),
      },
    },
  );
  return { sent: true, token, user };
}

export async function resetPassword(token, newPassword) {
  await ensureDb();
  const cleanPassword = vPassword(newPassword);
  const user = await db.collection(COLLECTION).findOne({
    resetTokenHash: tokenHash(token),
    resetExpires: { $gt: isoNow() },
  });
  if (!user) throw new ValidationError("This reset link is invalid or has expired.");
  const updated = await db.collection(COLLECTION).updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash: await hashPassword(cleanPassword),
        resetTokenHash: "",
        resetExpires: null,
        sessionVersion: Number(user.sessionVersion || 0) + 1,
        failedLogins: 0,
        lockedUntil: null,
        updatedAt: isoNow(),
      },
    },
  );
  return updated;
}

export async function changePassword(userId, currentPassword, newPassword) {
  await ensureDb();
  const user = await getUserById(userId);
  if (!user) throw httpError(404, "Account not found.");
  if (!(await verifyPassword(String(currentPassword || ""), user.passwordHash)))
    throw new ValidationError("Current password is incorrect.");
  const clean = vPassword(newPassword);
  await db.collection(COLLECTION).updateOne(
    { _id: userId },
    {
      $set: {
        passwordHash: await hashPassword(clean),
        sessionVersion: Number(user.sessionVersion || 0) + 1,
        updatedAt: isoNow(),
      },
    },
  );
  return true;
}

export async function updateProfile(userId, payload) {
  await ensureDb();
  const user = await getUserById(userId);
  if (!user) throw httpError(404, "Account not found.");
  const patch = { updatedAt: isoNow() };
  if (Object.prototype.hasOwnProperty.call(payload, "name"))
    patch.name = str(payload.name, "Name", { min: 2, max: 60 });
  if (Object.prototype.hasOwnProperty.call(payload, "bio"))
    patch.bio = str(payload.bio, "Bio", { max: 300, optional: true });
  if (Object.prototype.hasOwnProperty.call(payload, "avatarUrl"))
    patch.avatarUrl = payload.avatarUrl ? url(payload.avatarUrl, "Avatar URL") : "";
  if (payload.notificationPrefs && typeof payload.notificationPrefs === "object") {
    patch.notificationPrefs = {
      comments: bool(payload.notificationPrefs.comments, true),
      replies: bool(payload.notificationPrefs.replies, true),
      newsletter: bool(payload.notificationPrefs.newsletter, false),
      product: bool(payload.notificationPrefs.product, false),
    };
  }
  return db.collection(COLLECTION).updateOne({ _id: userId }, { $set: patch });
}

export async function deleteAccount(userId, password) {
  await ensureDb();
  const user = await getUserById(userId);
  if (!user) throw httpError(404, "Account not found.");
  if (!(await verifyPassword(String(password || ""), user.passwordHash)))
    throw new ValidationError("Password is incorrect.");
  await db.collection(COLLECTION).updateOne(
    { _id: userId },
    {
      $set: {
        name: "Former reader",
        email: `deleted-${user._id}@invalid.local`,
        username: `deleted-${user._id.slice(0, 8)}`,
        passwordHash: await hashPassword(randomBytes(24).toString("hex")),
        disabled: true,
        deletedAt: isoNow(),
        emailVerified: false,
        bio: "",
        avatarUrl: "",
        sessionVersion: Number(user.sessionVersion || 0) + 1,
        updatedAt: isoNow(),
      },
    },
  );
  await Promise.allSettled([
    db.collection("likes").deleteMany({ userId }),
    db.collection("bookmarks").deleteMany({ userId }),
  ]);
  return true;
}

export async function listUsers({ q = "", page = 1, limit = 20, role = "" } = {}) {
  await ensureDb();
  const filter = { deletedAt: null };
  if (role) filter.role = role;
  if (q) {
    const escaped = String(q).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { username: { $regex: escaped, $options: "i" } },
    ];
  }
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    db.collection(COLLECTION).find(filter, {
      sort: { createdAt: -1 },
      skip: (safePage - 1) * safeLimit,
      limit: safeLimit,
      projection: { passwordHash: 0, mfaSecret: 0, verifyTokenHash: 0, resetTokenHash: 0 },
    }),
    db.collection(COLLECTION).count(filter),
  ]);
  return { items, total, page: safePage, pages: Math.max(1, Math.ceil(total / safeLimit)) };
}

export async function adminUpdateUser(id, payload) {
  await ensureDb();
  const user = await getUserById(id);
  if (!user) throw httpError(404, "User not found.");
  if (user.role === "admin" && Object.prototype.hasOwnProperty.call(payload, "disabled")) {
    throw new ValidationError("The administrator account cannot be disabled from here.");
  }
  const patch = { updatedAt: isoNow() };
  if (Object.prototype.hasOwnProperty.call(payload, "disabled")) {
    patch.disabled = bool(payload.disabled, false);
    if (patch.disabled) patch.sessionVersion = Number(user.sessionVersion || 0) + 1;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "emailVerified")) {
    patch.emailVerified = bool(payload.emailVerified, false);
  }
  return db.collection(COLLECTION).updateOne({ _id: id }, { $set: patch });
}

export async function setMfaSecret(adminId, secret) {
  await ensureDb();
  return db.collection(COLLECTION).updateOne(
    { _id: adminId, role: "admin" },
    { $set: { mfaPendingSecret: secret, updatedAt: isoNow() } },
  );
}

export async function enableMfa(adminId) {
  await ensureDb();
  const user = await getUserById(adminId);
  if (!user?.mfaPendingSecret) throw new ValidationError("Start MFA setup first.");
  const updated = await db.collection(COLLECTION).updateOne(
    { _id: adminId },
    {
      $set: {
        mfaEnabled: true,
        mfaSecret: user.mfaPendingSecret,
        mfaPendingSecret: "",
        updatedAt: isoNow(),
      },
    },
  );
  return updated;
}

export async function disableMfa(adminId) {
  await ensureDb();
  return db.collection(COLLECTION).updateOne(
    { _id: adminId },
    { $set: { mfaEnabled: false, mfaSecret: "", mfaPendingSecret: "", updatedAt: isoNow() } },
  );
}

export async function userStats() {
  await ensureDb();
  const [total, admins, verified] = await Promise.all([
    db.collection(COLLECTION).count({ deletedAt: null }),
    db.collection(COLLECTION).count({ role: "admin", deletedAt: null }),
    db.collection(COLLECTION).count({ emailVerified: true, deletedAt: null }),
  ]);
  return { total, admins, verified, readers: Math.max(0, total - admins) };
}

export async function countRegistrations(from, to) {
  await ensureDb();
  return db.collection(COLLECTION).count({
    role: "user",
    createdAt: { $gte: from, $lte: to },
    deletedAt: null,
  });
}
