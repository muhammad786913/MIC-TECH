/** Likes, bookmarks and reading history for registered readers. */
import { db, ensureDb } from "@/lib/db/store";
import { httpError } from "@/lib/validation";
import { getArticleById } from "./articles";

async function publishedArticle(articleId) {
  const article = await getArticleById(articleId);
  if (!article || article.status !== "published") throw httpError(404, "Article not found.");
  return article;
}

export async function getEngagementCounts(articleIds = []) {
  await ensureDb();
  const ids = [...new Set(articleIds.filter(Boolean))];
  if (!ids.length) return {};
  const [likes, bookmarks, comments] = await Promise.all([
    db.collection("likes").find({ articleId: { $in: ids } }, { projection: { articleId: 1 } }),
    db.collection("bookmarks").find({ articleId: { $in: ids } }, { projection: { articleId: 1 } }),
    db.collection("comments").find(
      { articleId: { $in: ids }, status: "approved" },
      { projection: { articleId: 1 } },
    ),
  ]);
  const counts = {};
  for (const id of ids) counts[id] = { likes: 0, bookmarks: 0, comments: 0 };
  for (const item of likes) counts[item.articleId].likes += 1;
  for (const item of bookmarks) counts[item.articleId].bookmarks += 1;
  for (const item of comments) counts[item.articleId].comments += 1;
  return counts;
}

export async function getArticleEngagement(articleId, userId = "") {
  await ensureDb();
  const [likes, bookmarks, comments, liked, bookmarked] = await Promise.all([
    db.collection("likes").count({ articleId }),
    db.collection("bookmarks").count({ articleId }),
    db.collection("comments").count({ articleId, status: "approved" }),
    userId ? db.collection("likes").findOne({ articleId, userId }) : null,
    userId ? db.collection("bookmarks").findOne({ articleId, userId }) : null,
  ]);
  return { likes, bookmarks, comments, liked: Boolean(liked), bookmarked: Boolean(bookmarked) };
}

export async function toggleLike(userId, articleId) {
  await ensureDb();
  await publishedArticle(articleId);
  const existing = await db.collection("likes").findOne({ userId, articleId });
  if (existing) {
    await db.collection("likes").deleteOne({ _id: existing._id });
  } else {
    await db.collection("likes").insertOne({ userId, articleId, createdAt: new Date().toISOString() });
  }
  const count = await db.collection("likes").count({ articleId });
  return { active: !existing, count };
}

export async function toggleBookmark(userId, articleId) {
  await ensureDb();
  await publishedArticle(articleId);
  const existing = await db.collection("bookmarks").findOne({ userId, articleId });
  if (existing) {
    await db.collection("bookmarks").deleteOne({ _id: existing._id });
  } else {
    await db.collection("bookmarks").insertOne({
      userId,
      articleId,
      createdAt: new Date().toISOString(),
    });
  }
  const count = await db.collection("bookmarks").count({ articleId });
  return { active: !existing, count };
}

async function hydrate(records, { keepOrder = true } = {}) {
  if (!records.length) return [];
  const ids = records.map((record) => record.articleId);
  const articles = await db.collection("articles").find({ _id: { $in: ids }, deletedAt: null });
  const map = new Map(articles.map((article) => [article._id, article]));
  const ordered = keepOrder ? ids.map((id) => map.get(id)).filter(Boolean) : articles;
  const byId = new Map(records.map((record) => [record.articleId, record]));
  return ordered.map((article) => ({
    ...article,
    savedAt: byId.get(article._id)?.createdAt || null,
    isPublished: article.status === "published",
  }));
}

export async function listBookmarks(userId, limit = 40) {
  await ensureDb();
  const records = await db.collection("bookmarks").find(
    { userId },
    { sort: { createdAt: -1 }, limit },
  );
  return hydrate(records);
}

export async function listLikes(userId, limit = 40) {
  await ensureDb();
  const records = await db.collection("likes").find({ userId }, { sort: { createdAt: -1 }, limit });
  return hydrate(records);
}

export async function listReadingHistory(userId, limit = 30) {
  await ensureDb();
  const events = await db.collection("analyticsEvents").find(
    { userId, type: "pageview", articleId: { $ne: "" } },
    { sort: { createdAt: -1 }, limit: 200, projection: { articleId: 1 } },
  );
  const seen = [];
  for (const event of events) {
    if (!seen.includes(event.articleId)) seen.push(event.articleId);
    if (seen.length >= limit) break;
  }
  const articles = await db.collection("articles").find({
    _id: { $in: seen },
    status: "published",
    deletedAt: null,
  });
  const map = new Map(articles.map((article) => [article._id, article]));
  return seen.map((id) => map.get(id)).filter(Boolean);
}

export async function engagementTotals() {
  await ensureDb();
  const [likes, bookmarks, comments] = await Promise.all([
    db.collection("likes").count({}),
    db.collection("bookmarks").count({}),
    db.collection("comments").count({ status: "approved" }),
  ]);
  return { likes, bookmarks, comments };
}
