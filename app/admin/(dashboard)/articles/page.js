import Link from "next/link";
import { listAdminArticles, deleteArticle } from "@/lib/data/articles";
import { listCategories } from "@/lib/data/categories";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { EmptyState, StatusBadge } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Articles",
  description: "Manage MIC TECH articles.",
  path: "/admin/articles",
  noindex: true,
});

const STATUSES = ["all", "published", "draft", "scheduled", "archived"];

export default async function AdminArticlesPage({ searchParams }) {
  const query = await searchParams;
  const status = STATUSES.includes(query?.status) ? query.status : "all";
  const q = String(query?.q || "").slice(0, 100);
  const category = String(query?.category || "");
  const page = Math.max(1, Number(query?.page) || 1);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This will remove it from the public site.`)) return;
    try {
      await deleteArticle(id);
      // Re-fetch by refreshing the page
      window.location.reload();
    } catch (error) {
      alert("Could not delete the article: " + error.message);
    }
  }

  const [result, categories] = await Promise.all([
    listAdminArticles({ status, q, categorySlug: category, page, limit: 20 }),
    listCategories({ includeHidden: true }),
  ]);

  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  if (category) params.set("category", category);

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Editorial desk</p>
          <h1 className="mt-1 font-display text-4xl">Articles</h1>
          <p className="mt-1 text-sm text-ivory/70">{result.total} stories in this view.</p>
        </div>
        <Link href="/admin/articles/new" className="btn-gold">+ New story</Link>
      </header>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2 border border-line-dark bg-surface p-4">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="article-search" className="field-label">Search</label>
          <input id="article-search" name="q" defaultValue={q} className="input" placeholder="Headline, slug or tag" />
        </div>
        <div>
          <label htmlFor="article-status" className="field-label">Status</label>
          <select id="article-status" name="status" defaultValue={status} className="input">
            {STATUSES.map((item) => (
              <option key={item} value={item}>{item === "all" ? "All statuses" : item}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="article-category-filter" className="field-label">Category</label>
          <select id="article-category-filter" name="category" defaultValue={category} className="input">
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item._id} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-dark">Filter</button>
        {status !== "all" || q || category ? (
          <Link href="/admin/articles" className="px-2 py-2 text-[11px] uppercase tracking-[0.1em] text-ivory/55 hover:text-gold">Reset</Link>
        ) : null}
      </form>

      <div className="mt-5 overflow-x-auto border border-line-dark bg-surface">
        {result.items.length ? (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-dark bg-surface-2/60 text-[10px] uppercase tracking-[0.12em] text-ivory/55">
                <th className="px-4 py-3 font-semibold">Headline</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-dark">
              {result.items.map((article) => (
                <tr key={article._id} className="align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articles/${article._id}`} className="font-medium hover:text-gold">
                      {article.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-ivory/55">/news/{article.slug}</p>
                    {article.breaking ? <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-[0.12em] text-gold">Breaking</span> : null}
                    {article.featured ? <span className="mt-1 ml-2 inline-block text-[9px] font-bold uppercase tracking-[0.12em] text-ivory/55">Featured</span> : null}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={article.status} /></td>
                  <td className="px-4 py-3 text-xs text-ivory/55">{article.categoryName || "—"}</td>
                  <td className="px-4 py-3 text-xs text-ivory/55">{formatDate(article.updatedAt, { withTime: true })}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                      <Link href={`/admin/articles/${article._id}`} className="text-gold hover:text-ivory">Edit</Link>
                      <Link href={`/admin/articles/${article._id}/preview`} target="_blank" className="text-ivory/55 hover:text-ivory">Preview</Link>
                      <button type="button" onClick={() => handleDelete(article._id, article.title)} className="text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState title="No articles match this view">
              Adjust the filters or <Link href="/admin/articles/new" className="link-gold">start a new story</Link>.
            </EmptyState>
          </div>
        )}
      </div>

      {result.pages > 1 ? (
        <nav aria-label="Article pages" className="mt-4 flex items-center justify-between text-xs">
          <p className="text-ivory/55">Page {result.page} of {result.pages}</p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link href={`/admin/articles?${new URLSearchParams({ ...Object.fromEntries(params), page: String(result.page - 1) })}`} className="btn-outline">Previous</Link>
            ) : null}
            {result.page < result.pages ? (
              <Link href={`/admin/articles?${new URLSearchParams({ ...Object.fromEntries(params), page: String(result.page + 1) })}`} className="btn-outline">Next</Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
