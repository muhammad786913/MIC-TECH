/** Shared pure helpers. Safe to import from server and client components. */

export function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export function slugify(input, fallback = "story") {
  const value = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’"“”]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
  return value || fallback;
}

export function truncate(value, max = 160) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1);
  return `${sliced.replace(/\s+\S*$/, "")}…`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(value, { lang = "en", withTime = false } = {}) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(lang === "ur" ? "ur-PK" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      timeZone: "Asia/Karachi",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatDateTime(value) {
  return formatDate(value, { withTime: true });
}

export function timeAgo(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

export function isoNow() {
  return new Date().toISOString();
}

export function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export function number(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-US").format(Number.isFinite(n) ? n : 0);
}

export function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value) / Number(total)) * 1000) / 10;
}

export function readingTime(blocks = []) {
  const words = blocks
    .map((block) => {
      if (!block) return "";
      if (block.type === "text" || block.type === "richText")
        return block.text || "";
      if (block.type === "quote") return block.text || "";
      if (block.type === "highlight")
        return `${block.title || ""} ${block.text || ""}`;
      return block.caption || block.title || "";
    })
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 210));
}

export function absoluteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function initials(name) {
  return String(name || "MIC TECH")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function isBot(userAgent = "") {
  return /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headlesschrome|lighthouse|pingdom|uptimerobot|python-requests|curl|wget/i.test(
    userAgent,
  );
}

export function safeJson(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

/** Parse `2026-01` style input, returning an ISO string or null. */
export function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function rangeFromParams(searchParams = {}) {
  const range = String(searchParams.range || "7d");
  const preset = {
    today: 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };
  let days = preset[range] || 7;
  let from = null;
  let to = null;
  if (range === "custom") {
    from = parseDateInput(searchParams.from);
    to = parseDateInput(searchParams.to);
    if (from && !to) to = isoNow();
    if (from && to) days = Math.max(1, (new Date(to) - new Date(from)) / 86400000);
  }
  return {
    range,
    days,
    from: from || new Date(Date.now() - days * 86400000).toISOString(),
    to: to || isoNow(),
  };
}

export function compactPath(pathname = "/") {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}
