/** Reader comments, moderation and content reports. */
import { randomUUID } from "node:crypto";
import { db, ensureDb } from "@/lib/db/store";
import { config } from "@/lib/config";
import { ValidationError, httpError, oneOf, str } from "@/lib/validation";
import { isoNow } from "@/lib/utils";
import { getArticleById } from "./articles";
import { getSettings } from "./settings";

const SPAM_WORDS = [
  "viagra",
  "casino",
  "crypto giveaway",
  "free followers",
  "click here to win",
  "loan approval",
];

function linkCount(text) {
  return (String(text).match(/https?:\/\//gi) || []).length;
}

export async function listArticleComments(articleId) {
  await ensureDb();
  const comments = await db.collection("comments").find(
    { articleId, status: "approved" },
    { sort: { createdAt: 1 }, limit: 300 },
  );
  const byParent = new Map();
  for (const comment of comments) {
    const key = comment.parentId || "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(publicComment(comment));
  }
  const roots = byParent.get("root") || [];
  return roots.map((comment) => ({
    ...comment,
    replies: (byParent.get(comment._id) || []).map((reply) => ({
      ...reply,
      replies: byParent.get(reply._id) || [],
    })),
  }));
}

export function publicComment(comment) {
  return {
    _id: comment._id,
    articleId: comment.articleId,
    parentId: comment.parentId || null,
    userName: comment.userName || "Reader",
    userAvatar: comment.userAvatar || "",
    body: comment.body,
    createdAt: comment.createdAt,
    replies: [],
  };
}

export async function createComment({ user, articleId, body, parentId = null }) {
  await ensureDb();
  const settings = await getSettings();
  if (!settings.commentsEnabled) throw new ValidationError("Comments are currently closed.");
  if (config.emailVerificationRequired && !user.emailVerified) {
    throw new ValidationError("Verify your email address before commenting.");
  }
  const article = await getArticleById(articleId);
  if (!article || article.status !== "published")
    throw new ValidationError("Article not found.");
  const text = str(body, "Comment", { min: 2, max: 2000 });
  const links = linkCount(text);
  if (links > 2) throw new ValidationError("Comments may contain at most two links.");
  if (SPAM_WORDS.some((word) => text.toLowerCase().includes(word))) {
    throw new ValidationError("This comment was flagged as spam.");
  }
  if (parentId) {
    const parent = await db.collection("comments").findOne({
      _id: String(parentId),
      articleId,
      status: "approved",
    });
    if (!parent) throw new ValidationError("The comment you are replying to is unavailable.");
  }
  const status = settings.commentsAutoApprove && links === 0 ? "approved" : "pending";
  const now = isoNow();
  const comment = {
    _id: randomUUID(),
    articleId,
    userId: user._id,
    userName: user.name || "Reader",
    userAvatar: user.avatarUrl || "",
    parentId: parentId ? String(parentId) : null,
    body: text,
    status,
    createdAt: now,
    updatedAt: now,
    moderatedAt: null,
    moderatedBy: "",
  };
  await db.collection("comments").insertOne(comment);
  return { comment: publicComment(comment), status };
}

export async function listAdminComments({ status = "", page = 1, limit = 25 } = {}) {
  await ensureDb();
  const filter = {};
  if (status && status !== "all") filter.status = status;
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    db.collection("comments").find(filter, {
      sort: { createdAt: -1 },
      skip: (safePage - 1) * safeLimit,
      limit: safeLimit,
    }),
    db.collection("comments").count(filter),
  ]);
  const articleIds = [...new Set(items.map((item) => item.articleId))];
  const articles = articleIds.length
    ? await db.collection("articles").find(
        { _id: { $in: articleIds } },
        { projection: { title: 1, slug: 1 } },
      )
    : [];
  const articleMap = new Map(articles.map((article) => [article._id, article]));
  return {
    items: items.map((comment) => ({
      ...comment,
      article: articleMap.get(comment.articleId) || null,
    })),
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function moderateComment(id, status, admin) {
  await ensureDb();
  const cleanStatus = oneOf(status, ["approved", "rejected", "pending"], "Status");
  const updated = await db.collection("comments").updateOne(
    { _id: String(id) },
    {
      $set: {
        status: cleanStatus,
        moderatedAt: isoNow(),
        moderatedBy: admin._id,
        updatedAt: isoNow(),
      },
    },
  );
  if (!updated) throw httpError(404, "Comment not found.");
  return updated;
}

export async function deleteComment(id, { user, isAdmin = false } = {}) {
  await ensureDb();
  const comment = await db.collection("comments").findOne({ _id: String(id) });
  if (!comment) throw httpError(404, "Comment not found.");
  if (!isAdmin && comment.userId !== user?._id) throw httpError(403, "Not allowed.");
  await db.collection("comments").deleteOne({ _id: comment._id });
  if (!comment.parentId) await db.collection("comments").deleteMany({ parentId: comment._id });
  return true;
}

export async function commentStats() {
  await ensureDb();
  const [pending, approved, rejected, total] = await Promise.all([
    db.collection("comments").count({ status: "pending" }),
    db.collection("comments").count({ status: "approved" }),
    db.collection("comments").count({ status: "rejected" }),
    db.collection("comments").count({}),
  ]);
  return { pending, approved, rejected, total };
}

export async function listUserComments(userId) {
  await ensureDb();
  const items = await db.collection("comments").find(
    { userId },
    { sort: { createdAt: -1 }, limit: 100 },
  );
  const articleIds = [...new Set(items.map((item) => item.articleId))];
  const articles = articleIds.length
    ? await db.collection("articles").find(
        { _id: { $in: articleIds } },
        { projection: { title: 1, slug: 1, status: 1 } },
      )
    : [];
  const map = new Map(articles.map((article) => [article._id, article]));
  return items.map((comment) => ({ ...comment, article: map.get(comment.articleId) || null }));
}

export async function createReport({ reporter, targetType, targetId, reason, details }) {
  await ensureDb();
  const type = oneOf(targetType, ["article", "comment"], "Report type");
  const cleanReason = oneOf(
    reason,
    ["misinformation", "harassment", "spam", "hate", "copyright", "other"],
    "Reason",
  );
  const existing = await db.collection("reports").findOne({
    reporterId: reporter._id,
    targetType: type,
    targetId: String(targetId),
    status: "open",
  });
  if (existing) return existing;
  return db.collection("reports").insertOne({
    _id: randomUUID(),
    reporterId: reporter._id,
    reporterEmail: reporter.email,
    targetType: type,
    targetId: String(targetId),
    reason: cleanReason,
    details: str(details, "Details", { max: 1000, optional: true }),
    status: "open",
    createdAt: isoNow(),
    updatedAt: isoNow(),
  });
}

export async function listReports({ status = "open", limit = 50 } = {}) {
  await ensureDb();
  return db.collection("reports").find(status === "all" ? {} : { status }, {
    sort: { createdAt: -1 },
    limit: Math.min(Number(limit) || 50, 100),
  });
}

export async function resolveReport(id, status, admin) {
  await ensureDb();
  const cleanStatus = oneOf(status, ["open", "resolved", "dismissed"], "Report status");
  const updated = await db.collection("reports").updateOne(
    { _id: String(id) },
    {
      $set: {
        status: cleanStatus,
        resolvedAt: cleanStatus === "open" ? null : isoNow(),
        resolvedBy: admin?._id || "",
        updatedAt: isoNow(),
      },
    },
  );
  if (!updated) throw httpError(404, "Report not found.");
  return updated;
}

/** Newsletter subscribers (double opt-in is out of scope for v1; see docs). */
export async function subscribeNewsletter(address) {
  await ensureDb();
  const email = String(address || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email))
    throw new ValidationError("Enter a valid email address.");
  const existing = await db.collection("newsletterSubscribers").findOne({ email });
  if (existing) {
    if (existing.status === "unsubscribed") {
      await db.collection("newsletterSubscribers").updateOne(
        { _id: existing._id },
        { $set: { status: "subscribed", updatedAt: isoNow() } },
      );
    }
    return { already: true };
  }
  await db.collection("newsletterSubscribers").insertOne({
    _id: randomUUID(),
    email,
    status: "subscribed",
    source: "website",
    createdAt: isoNow(),
    updatedAt: isoNow(),
  });
  return { already: false };
}

export async function newsletterStats() {
  await ensureDb();
  return {
    subscribed: await db.collection("newsletterSubscribers").count({ status: "subscribed" }),
    total: await db.collection("newsletterSubscribers").count({}),
  };
}
