/** Categories (news desks). */
import { db, ensureDb } from "@/lib/db/store";
import { ValidationError, bool, int, str } from "@/lib/validation";
import { isoNow, slugify } from "@/lib/utils";

export const DEFAULT_CATEGORIES = [
  { name: "Pakistan", slug: "pakistan", description: "Politics, policy and power across the country.", order: 1 },
  { name: "World", slug: "world", description: "Global affairs, diplomacy and conflict.", order: 2 },
  { name: "Technology", slug: "technology", description: "AI, startups, devices and the digital economy.", order: 3 },
  { name: "Business", slug: "business", description: "Markets, industry and the economy.", order: 4 },
  { name: "Science", slug: "science", description: "Research, space and discovery.", order: 5 },
  { name: "Education", slug: "education", description: "Schools, universities and learning.", order: 6 },
  { name: "Sports", slug: "sports", description: "Cricket, football and the stories behind the score.", order: 7 },
  { name: "Entertainment", slug: "entertainment", description: "Film, music, culture and celebrity.", order: 8 },
  { name: "Health", slug: "health", description: "Medicine, wellbeing and public health.", order: 9 },
  { name: "Politics", slug: "politics", description: "Elections, governance and accountability.", order: 10 },
];

export async function listCategories({ includeHidden = false, withCounts = false } = {}) {
  await ensureDb();
  const filter = includeHidden ? {} : { hidden: { $ne: true } };
  const categories = await db.collection("categories").find(filter, { sort: { order: 1, name: 1 } });
  if (!withCounts) return categories;
  const counts = await Promise.all(
    categories.map(async (category) => {
      const [published, total] = await Promise.all([
        db.collection("articles").count({
          categoryId: category._id,
          status: "published",
          deletedAt: null,
        }),
        db.collection("articles").count({ categoryId: category._id, deletedAt: null }),
      ]);
      return { ...category, publishedCount: published, totalCount: total };
    }),
  );
  return counts;
}

export async function getCategoryBySlug(slug) {
  await ensureDb();
  return db.collection("categories").findOne({ slug: String(slug || "") });
}

export async function getCategoryById(id) {
  await ensureDb();
  return db.collection("categories").findOne({ _id: String(id || "") });
}

async function uniqueSlug(base, ignoreId = "") {
  let candidate = slugify(base, "category");
  let suffix = 2;
  while (true) {
    const existing = await db.collection("categories").findOne({ slug: candidate });
    if (!existing || existing._id === ignoreId) return candidate;
    candidate = `${slugify(base, "category")}-${suffix}`;
    suffix += 1;
    if (suffix > 100) throw new ValidationError("Could not create a unique category slug.");
  }
}

export async function createCategory(payload) {
  await ensureDb();
  const name = str(payload.name, "Category name", { min: 2, max: 60 });
  const slug = await uniqueSlug(payload.slug || name);
  const category = {
    _id: crypto.randomUUID(),
    name,
    slug,
    description: str(payload.description, "Description", { max: 300, optional: true }),
    order: int(payload.order, "Order", { min: 0, max: 999, fallback: 50 }),
    hidden: bool(payload.hidden, false),
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };
  return db.collection("categories").insertOne(category);
}

export async function updateCategory(id, payload) {
  await ensureDb();
  const existing = await getCategoryById(id);
  if (!existing) throw new ValidationError("Category not found.", undefined);
  const patch = { updatedAt: isoNow() };
  if (Object.prototype.hasOwnProperty.call(payload, "name"))
    patch.name = str(payload.name, "Category name", { min: 2, max: 60 });
  if (Object.prototype.hasOwnProperty.call(payload, "description"))
    patch.description = str(payload.description, "Description", { max: 300, optional: true });
  if (Object.prototype.hasOwnProperty.call(payload, "order"))
    patch.order = int(payload.order, "Order", { min: 0, max: 999, fallback: existing.order });
  if (Object.prototype.hasOwnProperty.call(payload, "hidden"))
    patch.hidden = bool(payload.hidden, existing.hidden);
  if (Object.prototype.hasOwnProperty.call(payload, "slug") || patch.name) {
    patch.slug = await uniqueSlug(payload.slug || patch.name || existing.name, id);
  }
  const updated = await db.collection("categories").updateOne({ _id: id }, { $set: patch });
  if (updated && (patch.slug !== existing.slug || patch.name !== existing.name)) {
    await db.collection("articles").updateMany(
      { categoryId: id },
      { $set: { categorySlug: updated.slug, categoryName: updated.name } },
    );
  }
  return updated;
}

export async function deleteCategory(id) {
  await ensureDb();
  const used = await db.collection("articles").count({ categoryId: id, deletedAt: null });
  if (used) {
    throw new ValidationError(
      `This category still has ${used} article${used === 1 ? "" : "s"}. Move or delete them first.`,
    );
  }
  return db.collection("categories").deleteOne({ _id: id });
}
