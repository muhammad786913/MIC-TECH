import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/data/articles";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import ArticleBody from "@/components/public/ArticleBody";
import SmartImage from "@/components/public/SmartImage";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Article preview",
  description: "Private preview of a MIC TECH article.",
  path: "/admin/articles",
  noindex: true,
});

export default async function ArticlePreviewPage({ params }) {
  const { id } = await params;
  const article = await getArticleById(id).catch(() => null);
  if (!article || article.deletedAt) notFound();
  const isRtl = article.language === "ur";

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border border-gold/40 bg-surface-2/60 p-3 text-xs text-ivory/70">
        <span>Private preview · {article.status} · not indexed</span>
        <Link href={`/admin/articles/${article._id}`} className="link-gold font-semibold">Back to editor →</Link>
      </div>

      <article className="border border-line-dark bg-surface p-5 sm:p-9">
        <p className="kicker">{article.categoryName}</p>
        <h1 dir={isRtl ? "rtl" : undefined} className={`mt-2 text-[clamp(2rem,4vw,3.4rem)] leading-[1.08] ${isRtl ? "text-right font-urdu leading-[1.9]" : "headline"}`}>
          {article.title}
        </h1>
        {article.subtitle ? (
          <p dir={isRtl ? "rtl" : undefined} className={`mt-3 font-body text-xl leading-relaxed text-ivory/70 ${isRtl ? "text-right font-urdu" : ""}`}>
            {article.subtitle}
          </p>
        ) : null}
        <p className="mt-4 border-y border-line-dark py-3 text-[11px] uppercase tracking-[0.1em] text-ivory/55">
          {article.authorName || "MIC TECH Desk"} · {formatDate(article.publishedAt || article.updatedAt, { withTime: true })}
        </p>
        {article.coverImage?.url ? (
          <div className="relative mt-5 aspect-[16/9] overflow-hidden bg-surface-2">
            <SmartImage src={article.coverImage.url} alt={article.coverImage.alt || article.title} fill sizes="920px" className="object-cover" />
          </div>
        ) : null}
        <div dir={isRtl ? "rtl" : undefined} className={`mt-6 ${isRtl ? "text-right font-urdu leading-[2.2]" : ""}`}>
          <ArticleBody blocks={article.blocks || []} />
        </div>
      </article>
    </div>
  );
}
