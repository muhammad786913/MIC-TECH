import { listCategories } from "@/lib/data/categories";
import { buildMetadata } from "@/lib/seo";
import ArticleEditor from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "New article",
  description: "Create a MIC TECH article.",
  path: "/admin/articles/new",
  noindex: true,
});

export default async function NewArticlePage() {
  const categories = await listCategories({ includeHidden: true });
  return <ArticleEditor categories={categories} />;
}
