import { listPublished } from "@/lib/data/articles";
import { listCategories } from "@/lib/data/categories";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "hourly" },
  { path: "/search", priority: 0.4, changeFrequency: "weekly" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/editorial-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/community-guidelines", priority: 0.3, changeFrequency: "yearly" },
  { path: "/corrections", priority: 0.3, changeFrequency: "yearly" },
];

async function publishedArticles() {
  const collected = [];
  let page = 1;
  let pages = 1;
  do {
    const result = await listPublished({ page, limit: 60 });
    collected.push(...(result.items || []));
    pages = result.pages || 1;
    page += 1;
  } while (page <= pages && page <= 50);
  return collected;
}

export default async function sitemap() {
  const [articles, categories] = await Promise.all([
    publishedArticles().catch((error) => {
      console.warn(`[sitemap] articles unavailable: ${error?.message || error}`);
      return [];
    }),
    listCategories().catch(() => []),
  ]);

  const entries = STATIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: new Date(),
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  for (const category of categories) {
    if (!category?.slug) continue;
    entries.push({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: category.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  for (const article of articles) {
    if (!article?.slug || article.seo?.noindex) continue;
    entries.push({
      url: absoluteUrl(article.seo?.canonical || `/news/${article.slug}`),
      lastModified: article.updatedAt || article.publishedAt || new Date(),
      changeFrequency: "weekly",
      priority: article.featured ? 0.9 : 0.7,
    });
  }

  return entries;
}
