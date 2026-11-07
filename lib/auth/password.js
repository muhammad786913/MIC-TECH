/** Password hashing with Node's scrypt. Format: scrypt$N$r$p$saltHex$hashHex */
import { scrypt as scryptCallback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password is too short to hash.");
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, PARAMS.keylen, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$");
}

export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, N, r, p, saltHex, hashHex] = parts;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    if (!salt.length || !expected.length) return false;
    const derived = await scrypt(
      password.normalize("NFKC"),
      salt,
      expected.length,
      { N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 },
    );
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
