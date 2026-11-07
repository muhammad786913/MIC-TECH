/** First-party analytics: collection, aggregation and dashboard data. */
import { randomUUID } from "node:crypto";
import { db, dbHealth, ensureDb } from "@/lib/db/store";
import { httpError, oneOf } from "@/lib/validation";
import { isoNow, rangeFromParams } from "@/lib/utils";
import { getArticleById, articleStats, listPublished } from "./articles";
import { engagementTotals } from "./engagement";
import { commentStats, newsletterStats } from "./comments";
import { userStats, countRegistrations } from "./users";
import { listCategories } from "./categories";
import { listAudit } from "@/lib/audit";

const MAX_EVENTS = 200_000;

export function sourceFromReferrer(referrer, siteUrl = "") {
  if (!referrer) return "direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "direct";
  }
  if (!host) return "direct";
  try {
    const siteHost = new URL(siteUrl || "http://localhost:3000").hostname.replace(/^www\./, "");
    if (host === siteHost) return "internal";
  } catch {
    /* ignore */
  }
  if (/google|bing|duckduckgo|yahoo|baidu|yandex/.test(host)) return "search";
  if (/facebook|instagram|twitter|x\.com|t\.co|linkedin|whatsapp|telegram|reddit|pinterest|tiktok/.test(host))
    return "social";
  return "referral";
}

export function parseUserAgent(userAgent = "") {
  const ua = String(userAgent || "");
  const device = /ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(ua)
    ? "tablet"
    : /mobile|iphone|ipod|android|blackberry|windows phone/i.test(ua)
      ? "mobile"
      : "desktop";
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /samsungbrowser/i.test(ua)
      ? "Samsung Internet"
      : /opr\//i.test(ua)
        ? "Opera"
        : /chrome|crios/i.test(ua)
          ? "Chrome"
          : /firefox|fxios/i.test(ua)
            ? "Firefox"
            : /safari/i.test(ua)
              ? "Safari"
              : "Other";
  const os = /windows/i.test(ua)
    ? "Windows"
    : /iphone|ipad|ios/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
        ? "Android"
        : /mac os|macintosh/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Other";
  return { device, browser, os };
}

export async function recordEvent({
  type,
  articleId = "",
  path = "/",
  referrer = "",
  request,
  user = null,
  visitorId,
}) {
  await ensureDb();
  const cleanType = oneOf(type, ["pageview", "share"], "Event type");
  if (!visitorId) throw httpError(400, "Visitor identifier missing.");
  let cleanPath = String(path || "/").split("?")[0].slice(0, 300);
  if (!cleanPath.startsWith("/")) cleanPath = "/";
  if (cleanPath.startsWith("/admin") || cleanPath.startsWith("/api")) return { skipped: true };
  let cleanArticleId = "";
  if (articleId) {
    const article = await getArticleById(String(articleId));
    if (article && article.status === "published") cleanArticleId = article._id;
  }
  const ua = request?.headers?.get("user-agent") || "";
  const { device, browser, os } = parseUserAgent(ua);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const source = sourceFromReferrer(referrer, siteUrl);
  const country = (request?.headers?.get("cf-ipcountry") || "").toUpperCase().slice(0, 2);
  const event = {
    _id: randomUUID(),
    type: cleanType,
    articleId: cleanArticleId,
    path: cleanPath,
    visitorId: String(visitorId).slice(0, 80),
    userId: user?._id || "",
    source,
    referrerHost: (() => {
      try {
        return referrer ? new URL(referrer).hostname.slice(0, 120) : "";
      } catch {
        return "";
      }
    })(),
    device,
    browser,
    os,
    country,
    createdAt: isoNow(),
  };
  await db.collection("analyticsEvents").insertOne(event);
  return { recorded: true };
}

export async function recordShare({ articleId, path, referrer, request, user, visitorId }) {
  return recordEvent({ type: "share", articleId, path, referrer, request, user, visitorId });
}

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function increment(map, key) {
  const clean = key || "unknown";
  map.set(clean, (map.get(clean) || 0) + 1);
}

async function eventsInRange({ from, to, articleId = "" }) {
  const filter = { createdAt: { $gte: from, $lte: to } };
  if (articleId) filter.articleId = articleId;
  const total = await db.collection("analyticsEvents").count(filter);
  const events = await db.collection("analyticsEvents").find(filter, {
    limit: MAX_EVENTS,
    sort: { createdAt: 1 },
    projection: {
      type: 1,
      articleId: 1,
      path: 1,
      visitorId: 1,
      source: 1,
      device: 1,
      browser: 1,
      os: 1,
      country: 1,
      createdAt: 1,
    },
  });
  return { events, total, truncated: total > events.length };
}

export async function getAnalytics(rangeInput = {}, { articleId = "" } = {}) {
  await ensureDb();
  const range = { ...rangeFromParams({}), ...rangeInput };
  const from = range.from;
  const to = range.to;
  const { events, total, truncated } = await eventsInRange({ from, to, articleId });
  const pageviews = events.filter((event) => event.type === "pageview");
  const shares = events.filter((event) => event.type === "share");

  const visitors = new Set();
  const pageviewsByVisitor = new Map();
  const sources = new Map();
  const devices = new Map();
  const browsers = new Map();
  const oses = new Map();
  const countries = new Map();
  const paths = new Map();
  const articleCounts = new Map();
  const articleVisitors = new Map();
  const daily = new Map();

  for (const event of pageviews) {
    const visitor = event.visitorId || "anonymous";
    visitors.add(visitor);
    pageviewsByVisitor.set(visitor, (pageviewsByVisitor.get(visitor) || 0) + 1);
    increment(sources, event.source || "direct");
    increment(devices, event.device || "unknown");
    increment(browsers, event.browser || "unknown");
    increment(oses, event.os || "unknown");
    increment(countries, event.country || "unknown");
    increment(paths, event.path || "/");
    increment(daily, dayKey(event.createdAt));
    if (event.articleId) {
      increment(articleCounts, event.articleId);
      if (!articleVisitors.has(event.articleId)) articleVisitors.set(event.articleId, new Set());
      articleVisitors.get(event.articleId).add(visitor);
    }
  }

  const articleIds = [...articleCounts.keys()];
  const articleDocs = articleIds.length
    ? await db.collection("articles").find(
        { _id: { $in: articleIds } },
        { projection: { title: 1, slug: 1, categoryName: 1, categorySlug: 1, coverImage: 1, publishedAt: 1 } },
      )
    : [];
  const articleMap = new Map(articleDocs.map((article) => [article._id, article]));

  const categories = new Map();
  for (const id of articleIds) {
    const article = articleMap.get(id);
    const key = article?.categoryName || "Uncategorised";
    categories.set(key, (categories.get(key) || 0) + (articleCounts.get(id) || 0));
  }

  const topArticles = articleIds
    .map((id) => ({
      articleId: id,
      article: articleMap.get(id) || null,
      views: articleCounts.get(id) || 0,
      visitors: articleVisitors.get(id)?.size || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  const dailySeries = [];
  const start = new Date(from);
  const end = new Date(to);
  const cap = 400;
  for (let index = 0; index < cap; index += 1) {
    const cursor = new Date(start.getTime() + index * 86400000);
    if (cursor > end) break;
    const key = cursor.toISOString().slice(0, 10);
    dailySeries.push({ date: key, views: daily.get(key) || 0 });
  }

  const [likes, bookmarks, comments, registrations, realtime] = await Promise.all([
    db.collection("likes").count({ createdAt: { $gte: from, $lte: to }, ...(articleId ? { articleId } : {}) }),
    db.collection("bookmarks").count({
      createdAt: { $gte: from, $lte: to },
      ...(articleId ? { articleId } : {}),
    }),
    db.collection("comments").count({
      createdAt: { $gte: from, $lte: to },
      ...(articleId ? { articleId } : {}),
    }),
    countRegistrations(from, to),
    realtimeVisitors(),
  ]);

  return {
    range: { from, to },
    totals: {
      pageviews: pageviews.length,
      visitors: visitors.size,
      shares: shares.length,
      likes,
      comments,
      bookmarks,
      registrations,
      events: events.length,
      returningVisitors: [...pageviewsByVisitor.values()].filter((count) => count > 1).length,
      truncated,
    },
    realtime,
    dailySeries,
    sources: toList(sources),
    devices: toList(devices),
    browsers: toList(browsers),
    os: toList(oses),
    countries: toList(countries),
    paths: toList(paths).slice(0, 20),
    categories: [...categories.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views),
    topArticles,
    eventsTotal: total,
  };
}

function toList(map) {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export async function realtimeVisitors(minutes = 5) {
  await ensureDb();
  const from = new Date(Date.now() - minutes * 60_000).toISOString();
  const events = await db.collection("analyticsEvents").find(
    { type: "pageview", createdAt: { $gte: from } },
    { limit: 5000, projection: { visitorId: 1, articleId: 1 } },
  );
  return {
    visitors: new Set(events.map((event) => event.visitorId)).size,
    views: events.length,
    minutes,
  };
}

export async function getArticleAnalytics(articleId, rangeInput = {}) {
  const article = await getArticleById(articleId);
  if (!article) return null;
  const analytics = await getAnalytics(rangeInput, { articleId });
  return { article, analytics };
}

export async function trendingArticleIds(days = 7, limit = 6) {
  await ensureDb();
  const from = new Date(Date.now() - days * 86400000).toISOString();
  const events = await db.collection("analyticsEvents").find(
    { type: "pageview", createdAt: { $gte: from }, articleId: { $ne: "" } },
    { limit: MAX_EVENTS, projection: { articleId: 1, visitorId: 1 } },
  );
  const counts = new Map();
  for (const event of events) increment(counts, event.articleId);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([articleId, views]) => ({ articleId, views }));
}

export async function getTrendingArticles(days = 7, limit = 5) {
  const ranked = await trendingArticleIds(days, limit);
  if (!ranked.length) {
    const latest = await listPublished({ limit });
    return latest.items.map((article) => ({ ...article, trendingViews: 0 }));
  }
  const docs = await db.collection("articles").find({
    _id: { $in: ranked.map((item) => item.articleId) },
    status: "published",
    deletedAt: null,
  });
  const map = new Map(docs.map((article) => [article._id, article]));
  return ranked
    .map((item) => {
      const article = map.get(item.articleId);
      return article ? { ...article, trendingViews: item.views } : null;
    })
    .filter(Boolean);
}

export async function getDashboardData(rangeInput = {}) {
  await ensureDb();
  const range = { ...rangeFromParams({}), ...rangeInput };
  const [analytics, articles, engagement, comments, newsletter, users, categories, audit, health] =
    await Promise.all([
      getAnalytics(range),
      articleStats(),
      engagementTotals(),
      commentStats(),
      newsletterStats(),
      userStats(),
      listCategories({ withCounts: true }),
      listAudit({ limit: 8 }),
      dbHealth(),
    ]);
  return {
    range,
    analytics,
    articles,
    engagement,
    comments,
    newsletter,
    users,
    categories,
    audit: audit.items,
    health,
  };
}
