/** Server-side validation helpers. Every mutation must validate through these. */

export class ValidationError extends Error {
  constructor(message, fields = undefined) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
    this.fields = fields;
  }
}

export function str(
  value,
  name = "Value",
  { min = 1, max = 5000, optional = false, trim = true } = {},
) {
  if (value === undefined || value === null) {
    if (optional) return "";
    throw new ValidationError(`${name} is required.`);
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${name} must be text.`);
  }
  const text = trim ? value.trim() : value;
  if (optional && !text) return "";
  if (text.length < min) {
    throw new ValidationError(
      min === 1 ? `${name} is required.` : `${name} must be at least ${min} characters.`,
    );
  }
  if (text.length > max) {
    throw new ValidationError(`${name} must be at most ${max} characters.`);
  }
  return text;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function email(value, name = "Email") {
  const text = str(value, name, { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(text)) throw new ValidationError("Enter a valid email address.");
  return text;
}

export function password(value, name = "Password") {
  const text = typeof value === "string" ? value : "";
  if (text.length < 10)
    throw new ValidationError(`${name} must be at least 10 characters.`);
  if (text.length > 128)
    throw new ValidationError(`${name} must be at most 128 characters.`);
  if (!/[A-Za-z]/.test(text) || !/[0-9]/.test(text))
    throw new ValidationError(`${name} must include at least one letter and one number.`);
  return text;
}

export function bool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

export function int(value, name = "Value", { min = 0, max = 1_000_000, fallback } = {}) {
  if ((value === undefined || value === null || value === "") && fallback !== undefined)
    return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n))
    throw new ValidationError(`${name} must be a whole number.`);
  if (n < min || n > max)
    throw new ValidationError(`${name} must be between ${min} and ${max}.`);
  return n;
}

export function date(value, name = "Date", { optional = true } = {}) {
  if (!value) {
    if (optional) return null;
    throw new ValidationError(`${name} is required.`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new ValidationError(`${name} is invalid.`);
  return parsed.toISOString();
}

export function oneOf(value, allowed, name = "Value") {
  const text = String(value || "");
  if (!allowed.includes(text))
    throw new ValidationError(`${name} must be one of: ${allowed.join(", ")}.`);
  return text;
}

export function array(value, name = "List", { max = 30, of = "string" } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError(`${name} must be a list.`);
  if (value.length > max) throw new ValidationError(`${name} has too many items.`);
  if (of === "string") {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, max)
      .map((item) => item.slice(0, 60));
  }
  return value;
}

export function slug(value, name = "Slug") {
  const text = str(value, name, { min: 1, max: 120 });
  if (!/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(text))
    throw new ValidationError(`${name} may only contain letters, numbers and hyphens.`);
  return text;
}

export function url(value, name = "URL", { optional = true, relative = true } = {}) {
  if (!value) {
    if (optional) return "";
    throw new ValidationError(`${name} is required.`);
  }
  if (typeof value !== "string") throw new ValidationError(`${name} is invalid.`);
  const text = value.trim();
  if (text.length > 2048) throw new ValidationError(`${name} is too long.`);
  if (relative && text.startsWith("/") && !text.startsWith("//")) return text;
  try {
    const parsed = new URL(text);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
    return parsed.toString();
  } catch {
    throw new ValidationError(`${name} must be an http(s) or site-relative URL.`);
  }
}

/** Reject objects containing Mongo-style operator keys anywhere. */
export function plainObject(value, name = "Payload", { maxKeys = 200 } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${name} is invalid.`);
  }
  const seen = new Set();
  const walk = (node, depth) => {
    if (depth > 8) throw new ValidationError(`${name} is too deeply nested.`);
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, depth + 1));
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$") || key.includes("."))
        throw new ValidationError(`${name} contains an unsupported key.`);
      seen.add(key);
      walk(child, depth + 1);
    }
  };
  walk(value, 0);
  if (seen.size > maxKeys) throw new ValidationError(`${name} has too many fields.`);
  return value;
}

export function httpError(status, message, fields) {
  const error = new Error(message);
  error.status = status;
  error.fields = fields;
  return error;
}
