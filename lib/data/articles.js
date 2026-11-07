/** Article reads and writes. Public queries only ever expose published content. */
import { db, ensureDb } from "@/lib/db/store";
import { ValidationError } from "@/lib/validation";
import { normalizeArticleInput } from "@/lib/content";
import { isoNow, slugify } from "@/lib/utils";
import { getCategoryById } from "./categories";

const COLLECTION = "articles";
const PUBLIC_STATUS = "published";

const scheduledCache = globalThis.__micScheduledPublish || {
  last: 0,
  running: null,
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function publishDueArticles({ force = false } = {}) {
  await ensureDb();
  const now = Date.now();
  if (!force && now - scheduledCache.last < 20_000) return 0;
  if (scheduledCache.running) return scheduledCache.running;
  scheduledCache.last = now;
  scheduledCache.running = (async () => {
    const iso = new Date(now).toISOString();
    const due = await db
      .collection(COLLECTION)
      .find({ status: "scheduled", scheduledAt: { $lte: iso }, deletedAt: null }, { limit: 50 });
    for (const article of due) {
      await db.collection(COLLECTION).updateOne(
        { _id: article._id, status: "scheduled" },
        {
          $set: {
            status: PUBLIC_STATUS,
            publishedAt: article.scheduledAt || iso,
            scheduledAt: null,
            updatedAt: iso,
          },
        },
      );
    }
    return due.length;
  })().finally(() => {
    scheduledCache.running = null;
  });
  return scheduledCache.running;
}

function publicFilter(extra = {}) {
  return {
    status: PUBLIC_STATUS,
    publishedAt: { $lte: isoNow() },
    deletedAt: null,
    ...extra,
  };
}

export async function listPublished({
  categorySlug = "",
  tag = "",
  language = "",
  q = "",
  featured,
  breaking,
  excludeId = "",
  page = 1,
  limit = 12,
  sort = "latest",
} = {}) {
  await ensureDb();
  await publishDueArticles();
  const filter = publicFilter();
  if (categorySlug) filter.categorySlug = categorySlug;
  if (tag) filter.tags = tag;
  if (language) filter.language = language;
  if (typeof featured === "boolean") filter.featured = featured;
  if (typeof breaking === "boolean") filter.breaking = breaking;
  if (excludeId) filter._id = { $ne: excludeId };
  if (q) {
    const regex = escapeRegex(q.slice(0, 100));
    filter.$or = [
      { title: { $regex: regex, $options: "i" } },
      { excerpt: { $regex: regex, $options: "i" } },
      { subtitle: { $regex: regex, $options: "i" } },
      { categoryName: { $regex: regex, $options: "i" } },
    ];
  }
  const order =
    sort === "oldest" ? { publishedAt: 1 } : sort === "updated" ? { updatedAt: -1 } : { publishedAt: -1 };
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 60);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    db.collection(COLLECTION).find(filter, {
      sort: order,
      skip: (safePage - 1) * safeLimit,
      limit: safeLimit,
      projection: { blocks: 0 },
    }),
    db.collection(COLLECTION).count(filter),
  ]);
  return {
    items,
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
    limit: safeLimit,
  };
}

export async function getPublicArticle(slug) {
  await ensureDb();
  await publishDueArticles();
  const article = await db.collection(COLLECTION).findOne({ slug: String(slug || ""), deletedAt: null });
  if (!article || article.status !== PUBLIC_STATUS) return null;
  if (article.publishedAt && new Date(article.publishedAt).getTime() > Date.now()) return null;
  return article;
}

export async function getArticleBySlug(slug) {
  await ensureDb();
  return db.collection(COLLECTION).findOne({ slug: String(slug || ""), deletedAt: null });
}

export async function getArticleById(id) {
  await ensureDb();
  return db.collection(COLLECTION).findOne({ _id: String(id || ""), deletedAt: null });
}

export async function getRelatedArticles(article, limit = 3) {
  await ensureDb();
  if (!article) return [];
  const sameCategory = await listPublished({
    categorySlug: article.categorySlug,
    excludeId: article._id,
    limit,
  });
  if (sameCategory.items.length >= limit) return sameCategory.items;
  const fallback = await listPublished({ excludeId: article._id, limit });
  const seen = new Set(sameCategory.items.map((item) => item._id));
  return [...sameCategory.items, ...fallback.items.filter((item) => !seen.has(item._id))].slice(0, limit);
}

export async function getArticlesByIds(ids = []) {
  await ensureDb();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const items = await db.collection(COLLECTION).find({ _id: { $in: unique } });
  const map = new Map(items.map((item) => [item._id, item]));
  return unique.map((id) => map.get(id)).filter(Boolean);
}

export async function listAdminArticles({
  status = "",
  q = "",
  categorySlug = "",
  page = 1,
  limit = 20,
  sort = "updated",
} = {}) {
  await ensureDb();
  const filter = { deletedAt: null };
  if (status && status !== "all") filter.status = status;
  if (categorySlug) filter.categorySlug = categorySlug;
  if (q) {
    const regex = escapeRegex(q.slice(0, 100));
    filter.$or = [
      { title: { $regex: regex, $options: "i" } },
      { slug: { $regex: regex, $options: "i" } },
      { tags: { $regex: regex, $options: "i" } },
    ];
  }
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const order = sort === "created" ? { createdAt: -1 } : { updatedAt: -1 };
  const [items, total] = await Promise.all([
    db.collection(COLLECTION).find(filter, {
      sort: order,
      skip: (safePage - 1) * safeLimit,
      limit: safeLimit,
      projection: { blocks: 0 },
    }),
    db.collection(COLLECTION).count(filter),
  ]);
  return { items, total, page: safePage, pages: Math.max(1, Math.ceil(total / safeLimit)) };
}

async function uniqueSlug(base, ignoreId = "") {
  let candidate = slugify(base, "story");
  let suffix = 2;
  while (true) {
    const existing = await db.collection(COLLECTION).findOne({ slug: candidate });
    if (!existing || existing._id === ignoreId) return candidate;
    candidate = `${slugify(base, "story")}-${suffix}`;
    suffix += 1;
    if (suffix > 200) throw new ValidationError("Could not create a unique article URL.");
  }
}

function resolveSchedule(input, existing) {
  const now = isoNow();
  let status = input.status ?? existing?.status ?? "draft";
  let publishedAt = existing?.publishedAt || null;
  let scheduledAt = input.scheduledAt ?? existing?.scheduledAt ?? null;

  if (input.publishedAt !== undefined) publishedAt = input.publishedAt;

  if (status === "published") {
    publishedAt = publishedAt || now;
    scheduledAt = null;
  } else if (status === "scheduled") {
    if (!scheduledAt) throw new ValidationError("Choose a publication time for scheduled articles.");
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      status = "published";
      publishedAt = scheduledAt;
      scheduledAt = null;
    } else {
      publishedAt = null;
    }
  } else if (status === "draft") {
    publishedAt = null;
  } else if (status === "archived") {
    publishedAt = null;
    scheduledAt = null;
  }
  return { status, publishedAt, scheduledAt };
}

async function resolveCategory(categoryId) {
  const category = await getCategoryById(categoryId);
  if (!category) throw new ValidationError("Choose a valid category.");
  return category;
}

export async function createArticle(admin, payload) {
  await ensureDb();
  const input = normalizeArticleInput(payload, { partial: false });
  const category = await resolveCategory(input.categoryId);
  const schedule = resolveSchedule(input, null);
  const slug = await uniqueSlug(input.slug || input.title);
  const now = isoNow();
  const article = {
    _id: crypto.randomUUID(),
    slug,
    title: input.title,
    subtitle: input.subtitle,
    excerpt: input.excerpt,
    language: input.language,
    categoryId: category._id,
    categorySlug: category.slug,
    categoryName: category.name,
    tags: input.tags,
    coverImage: input.coverImage,
    blocks: input.blocks,
    status: schedule.status,
    publishedAt: schedule.publishedAt,
    scheduledAt: schedule.scheduledAt,
    featured: input.featured,
    breaking: input.breaking,
    sponsored: input.sponsored,
    seo: input.seo,
    readingTime: input.readingTime || 1,
    authorId: admin._id,
    authorName: admin.name || "MIC TECH Desk",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  return db.collection(COLLECTION).insertOne(article);
}

export async function updateArticle(id, admin, payload) {
  await ensureDb();
  const existing = await getArticleById(id);
  if (!existing) throw new ValidationError("Article not found.");
  const input = normalizeArticleInput(payload, { partial: true });
  const patch = { ...input };

  if (input.categoryId && input.categoryId !== existing.categoryId) {
    const category = await resolveCategory(input.categoryId);
    patch.categoryId = category._id;
    patch.categorySlug = category.slug;
    patch.categoryName = category.name;
  }
  if (!patch.slug && Object.prototype.hasOwnProperty.call(payload, "slug")) delete patch.slug;
  if (patch.slug) patch.slug = await uniqueSlug(patch.slug, id);

  const schedule = resolveSchedule(
    {
      status: patch.status,
      scheduledAt: patch.scheduledAt,
      publishedAt: patch.publishedAt,
    },
    existing,
  );
  patch.status = schedule.status;
  patch.publishedAt = schedule.publishedAt;
  patch.scheduledAt = schedule.scheduledAt;
  patch.updatedAt = isoNow();
  if (payload.status === "published" && !existing.publishedAt) {
    patch.publishedAt = patch.publishedAt || isoNow();
  }
  delete patch.readingTime;
  if (input.blocks) patch.readingTime = input.readingTime;

  const updated = await db.collection(COLLECTION).updateOne({ _id: id, deletedAt: null }, { $set: patch });
  return updated;
}

export async function archiveArticle(id) {
  await ensureDb();
  return db.collection(COLLECTION).updateOne(
    { _id: id, deletedAt: null },
    { $set: { status: "archived", publishedAt: null, scheduledAt: null, updatedAt: isoNow() } },
  );
}

export async function deleteArticle(id) {
  await ensureDb();
  const existing = await getArticleById(id);
  if (!existing) return false;
  await db.collection(COLLECTION).updateOne(
    { _id: id },
    { $set: { deletedAt: isoNow(), status: "archived", publishedAt: null, scheduledAt: null } },
  );
  return true;
}

export async function articleStats() {
  await ensureDb();
  const base = { deletedAt: null };
  const [published, draft, scheduled, archived, breaking] = await Promise.all([
    db.collection(COLLECTION).count({ ...base, status: "published" }),
    db.collection(COLLECTION).count({ ...base, status: "draft" }),
    db.collection(COLLECTION).count({ ...base, status: "scheduled" }),
    db.collection(COLLECTION).count({ ...base, status: "archived" }),
    db.collection(COLLECTION).count({ ...base, status: "published", breaking: true }),
  ]);
  return { published, draft, scheduled, archived, breaking, total: published + draft + scheduled + archived };
}

export async function allPublishedTags(limit = 40) {
  await ensureDb();
  const articles = await db.collection(COLLECTION).find(publicFilter(), {
    projection: { tags: 1 },
    sort: { publishedAt: -1 },
    limit: 400,
  });
  const counts = new Map();
  for (const article of articles) {
    for (const tag of article.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}
