import { listCategories } from "@/lib/data/categories";
import { buildMetadata } from "@/lib/seo";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Categories",
  description: "Manage MIC TECH desks.",
  path: "/admin/categories",
  noindex: true,
});

export default async function AdminCategoriesPage() {
  const categories = await listCategories({ includeHidden: true, withCounts: true });
  return (
    <div className="mx-auto max-w-[1400px]">
      <header>
        <p className="kicker">Structure</p>
        <h1 className="mt-1 font-display text-4xl">Categories</h1>
        <p className="mt-1 text-sm text-ivory/70">Desks drive navigation, section pages and SEO structure.</p>
      </header>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
