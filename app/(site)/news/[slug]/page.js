import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicArticle, getRelatedArticles } from "@/lib/data/articles";
import { getArticleEngagement } from "@/lib/data/engagement";
import { listArticleComments } from "@/lib/data/comments";
import { getSettings } from "@/lib/data/settings";
import { getCurrentUser } from "@/lib/auth/guards";
import { cookies } from "next/headers";
import { VISITOR_COOKIE } from "@/lib/config";
import { articlePath, breadcrumbLd, buildMetadata, newsArticleLd } from "@/lib/seo";
import { formatDate, readingTime } from "@/lib/utils";
import ArticleBody from "@/components/public/ArticleBody";
import ArticleCard from "@/components/public/ArticleCard";
import Comments from "@/components/public/Comments";
import EngagementBar from "@/components/public/EngagementBar";
import JsonLd from "@/components/public/JsonLd";
import ReadingProgress from "@/components/public/ReadingProgress";
import ShareRail from "@/components/public/ShareRail";
import SmartImage from "@/components/public/SmartImage";
import SectionHeading from "@/components/public/SectionHeading";
import Icon from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

async function loadArticle(slug) {
  try {
    return await getPublicArticle(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) {
    return buildMetadata({ title: "Story not found", path: `/news/${slug}`, noindex: true });
  }
  const canonical = article.seo?.canonical || articlePath(article);
  return {
    ...buildMetadata({
      title: article.seo?.title || article.title,
      description: article.seo?.description || article.excerpt,
      path: canonical,
      image: article.seo?.socialImage || article.coverImage?.url,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.authorName].filter(Boolean),
      section: article.categoryName,
      tags: article.tags,
      noindex: Boolean(article.seo?.noindex),
      language: article.language,
    }),
    other: { "mic-article-id": article._id },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) notFound();

  const [related, engagement, comments, settings, user] = await Promise.all([
    getRelatedArticles(article, 3).catch(() => []),
    (async () => {
      // For anonymous users, use the visitor cookie to track their likes/bookmarks.
      const cookieStore = await cookies();
      const visitorId = cookieStore.get(VISITOR_COOKIE)?.value || "";
      return getArticleEngagement(article._id, visitorId).catch(() => ({
        likes: 0,
        bookmarks: 0,
        comments: 0,
        liked: false,
        bookmarked: false,
      }));
    })(),
    listArticleComments(article._id).catch(() => []),
    getSettings().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);

  const viewerEngagement = user
    ? await getArticleEngagement(article._id, user._id).catch(() => engagement)
    : engagement;

  const path = articlePath(article);
  const canonical = article.seo?.canonical || path;
  const commentsCount = engagement.comments || comments.length;
  const approvedComments = commentsCount;

  return (
    <>
      <ReadingProgress />
      <JsonLd
        data={[
          newsArticleLd(article, { canonical }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: article.categoryName || "News", path: `/category/${article.categorySlug}` },
            { name: article.title, path },
          ]),
        ]}
      />

      <div className="wrap pt-5">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-ivory/55">
          <Link href="/" className="hover:text-gold">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/category/${article.categorySlug}`} className="hover:text-gold">
            {article.categoryName}
          </Link>
        </nav>
      </div>

      <header className="wrap mt-6">
        <div className="mx-auto max-w-[860px]">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/category/${article.categorySlug}`}
              className="bg-ink px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gold-soft"
            >
              {article.categoryName}
            </Link>
            {article.breaking ? (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gold">
                <Icon name="flame" size={11} /> Breaking
              </span>
            ) : null}
            {article.sponsored ? (
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ivory/55">
                Sponsored
              </span>
            ) : null}
          </div>

          <h1 className="headline">
            {article.title}
          </h1>

          {article.subtitle ? (
            <p
                className="mt-4 max-w-3xl font-body text-[clamp(1.05rem,1.7vw,1.35rem)] leading-relaxed text-ivory/70"
            >
              {article.subtitle}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line-dark py-3 text-[11px] uppercase tracking-[0.08em] text-ivory/55">
            <span className="flex items-center gap-1.5 font-semibold text-ivory">
              <Icon name="user" size={13} className="text-gold" />
              {article.authorName || "MIC TECH Desk"}
            </span>
            <span className="h-3 w-px bg-line-dark" aria-hidden="true" />
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, { withTime: true })}</time>
            <span className="h-3 w-px bg-line-dark" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <Icon name="clock" size={13} /> {article.readingTime || readingTime(article.blocks)} min read
            </span>
          </div>
        </div>
      </header>

      {article.coverImage?.url ? (
        <figure className="wrap mt-6">
          <div className="mx-auto max-w-[1100px]">
            <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
              <SmartImage
                src={article.coverImage.url}
                alt={article.coverImage.alt || article.title}
                fill
                priority
                sizes="(max-width: 1100px) 100vw, 1100px"
                className="object-cover"
              />
            </div>
            {article.coverImage.credit ? (
              <figcaption className="mt-2 text-right text-[11px] text-ivory/55">
                {article.coverImage.credit}
              </figcaption>
            ) : null}
          </div>
        </figure>
      ) : null}

      <div className="wrap mt-8">
        <div className="mx-auto grid max-w-[1060px] gap-8 lg:grid-cols-[64px_minmax(0,860px)]">
          <aside className="no-print hidden lg:block">
            <div className="sticky top-28">
              <ShareRail url={canonical} title={article.title} articleId={article._id} path={path} />
            </div>
          </aside>

          <article>
            <div className="lg:hidden">
              <ShareRail url={canonical} title={article.title} articleId={article._id} path={path} />
            </div>

            <ArticleBody blocks={article.blocks || []} />

            {article.tags?.length ? (
              <div className="no-print mt-8 flex flex-wrap items-center gap-2 border-t border-line-dark pt-5">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">
                  Topics
                </span>
                {article.tags.map((tag) => (
                  <Link key={tag} href={`/tag/${tag}`} className="chip">
                    {tag.replace(/-/g, " ")}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="no-print mt-6">
              <EngagementBar
                articleId={article._id}
                title={article.title}
                path={path}
                signedIn={Boolean(user)}
                initial={{
                  likes: viewerEngagement.likes,
                  bookmarks: viewerEngagement.bookmarks,
                  comments: approvedComments,
                  liked: viewerEngagement.liked,
                  bookmarked: viewerEngagement.bookmarked,
                }}
              />
            </div>

            <div className="no-print mt-8 flex items-start gap-4 border border-line-dark bg-surface p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-display text-sm text-gold">
                MT
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">
                  Reported by
                </p>
                <p className="mt-1 font-display text-lg">{article.authorName || "MIC TECH Desk"}</p>
                <p className="mt-1 font-body text-sm leading-relaxed text-ivory/70">
                  MIC TECH editorial. Independent reporting, with corrections and accountability
                  published in the open.
                </p>
                <Link href="/editorial-policy" className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-[0.1em] text-gold hover:text-ivory">
                  Editorial standards →
                </Link>
              </div>
            </div>

            <div className="no-print mt-10">
              <Comments
                articleId={article._id}
                path={path}
                initial={comments}
                signedIn={Boolean(user)}
                enabled={settings?.commentsEnabled !== false}
                count={approvedComments}
              />
            </div>
          </article>
        </div>
      </div>

      {related.length ? (
        <section className="wrap mt-14">
          <SectionHeading eyebrow="Keep reading" title="Related reporting" href={`/category/${article.categorySlug}`} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item._id} article={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
