import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/data/articles";
import { listCategories } from "@/lib/data/categories";
import { buildMetadata } from "@/lib/seo";
import ArticleEditor from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Edit article",
  description: "Edit a MIC TECH article.",
  path: "/admin/articles",
  noindex: true,
});

export default async function EditArticlePage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const [article, categories] = await Promise.all([
    getArticleById(id).catch(() => null),
    listCategories({ includeHidden: true }),
  ]);
  if (!article || article.deletedAt) notFound();

  return (
    <div>
      {query?.created ? (
        <p className="mx-auto mb-4 max-w-[1500px] border border-gold/40 bg-surface-2/60 p-3 text-sm text-ivory/70">
          Story created. You are now editing the saved version.
        </p>
      ) : null}
      {query?.published ? (
        <p className="mx-auto mb-4 max-w-[1500px] border border-gold/40 bg-surface-2/60 p-3 text-sm text-ivory/70">
          Story published. <Link href={`/news/${article.slug}`} className="link-gold font-semibold">View it live</Link>.
        </p>
      ) : null}
      <ArticleEditor article={article} categories={categories} />
    </div>
  );
}
