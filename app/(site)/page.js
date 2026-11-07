import Link from "next/link";
import { listPublished } from "@/lib/data/articles";
import { getTrendingArticles } from "@/lib/data/analytics";
import { listCategories } from "@/lib/data/categories";
import { getSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo";
import ArticleCard from "@/components/public/ArticleCard";
import SectionHeading from "@/components/public/SectionHeading";
import JsonLd from "@/components/public/JsonLd";
import NewsletterForm from "@/components/public/NewsletterForm";
import SearchForm from "@/components/public/SearchForm";
import Icon from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "MIC TECH — News with precision and perspective",
  description:
    "Independent reporting and analysis on Pakistan, world affairs, technology, business and culture.",
  path: "/",
});

const DESK_SLUGS = ["pakistan", "world", "business", "technology", "science", "health"];

async function safe(promise, fallback) {
  try {
    return await promise;
  } catch (error) {
    console.warn(`[home] ${error?.message || error}`);
    return fallback;
  }
}

export default async function HomePage() {
  // Get 20 latest published articles for the main feed
  const latestResult = await safe(listPublished({ limit: 20 }), { items: [] });
  const latestItems = latestResult.items;

  // Get featured articles (marked as featured)
  const featuredResult = await safe(listPublished({ featured: true, limit: 5 }), { items: [] });
  const featuredLead = featuredResult.items[0] || null;

  // Get breaking news articles
  const breakingResult = await safe(listPublished({ breaking: true, limit: 6 }), { items: [] });
  const breakingArticles = breakingResult.items;

  // Get categories for navigation
  const categories = await safe(listCategories(), []);

  // Get trending articles
  const trendingResult = await safe(getTrendingArticles(7, 8), []);
  const trendingItems = trendingResult.items;

  // Get settings
  const settings = await safe(getSettings(), null);

  // Build category desks (Pakistan, World, Business, plus available ones)
  const deskSlugs = DESK_SLUGS;
  const desks = await Promise.all(
    deskSlugs.map(async (slug) => {
      const category = categories.find((item) => item.slug === slug);
      if (!category) return null;
      const result = await safe(listPublished({ categorySlug: slug, limit: 4 }), { items: [] });
      if (!result.items.length) return null;
      return { category, articles: result.items };
    }),
  );

  // Determine the main pool of articles: featured lead first, then latest items
  let pool = [];
  if (featuredLead) {
    pool = [featuredLead];
  }
  // Add latest items that aren't already in the pool
  const latestNotInPool = latestItems.filter(
    (a) => !pool.some((p) => p._id === a._id),
  );
  pool = [...pool, ...latestNotInPool];

  // Identify lead and hero articles from the main pool
  const lead = pool[0] || null;
  // Hero side: next 3 articles after lead
  const heroSide = pool.slice(1, 4);
  const heroIds = new Set([lead?._id, ...heroSide.map((article) => article._id)].filter(Boolean));
  // Feed: remaining articles after hero, limited so total = 20 (lead + hero + feed = 20)
  const maxFeedCount = 20 - 1 /* lead */ - heroSide.length;
  const feed = latestItems.filter((article) => !heroIds.has(article._id)).slice(0, maxFeedCount);

  // Build a Set of all article IDs on the homepage for quick lookup
  const homepageArticleIds = new Set([
    ...(feed && feed.length > 0 ? feed.map((a) => a._id) : []),
    ...(heroSide.length > 0 ? heroSide.map((a) => a._id) : []),
    lead?._id,
  ]);

  if (!lead && !featuredLead) {
    return (
      <div className="wrap py-20">
        <div className="mx-auto max-w-xl border border-line-dark bg-surface p-10 text-center">
          <p className="kicker">MIC TECH</p>
          <h1 className="mt-2 font-display text-4xl">The newsroom is being prepared</h1>
          <p className="mt-3 font-body text-lg text-ivory/70">
            No stories have been published yet. Sign in to the admin desk to create the first
            report, or run the development seed to load demo editorial content.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/admin/login" className="btn-gold">
              Admin sign in
            </Link>
            <Link href="/about" className="btn-outline">
              About MIC TECH
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "MIC TECH",
            url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          },
        ]}
      />

      <section className="wrap pt-6 lg:pt-8">
        <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          {/* Featured/Lead article */}
          {lead ? (
            <ArticleCard article={lead} variant="lead" eager className="min-h-[420px]" />
          ) : null}

          {/* Breaking news ticker (if breaking articles exist) */}
          {breakingArticles.length > 0 && (
            <section className="wrap mt-6 lg:mt-8 bg-ink border-b border-gold/25">
              <div className="wrap py-3">
                <p className="kicker text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Breaking News
                </p>
                <div className="flex flex-wrap gap-3">
                  {breakingArticles.slice(0, 6).map((article) => (
                    <Link
                      key={article._id}
                      href={`/news/${article.slug}`}
                      className="text-[10px] font-medium uppercase tracking-[0.12em] text-gold-soft hover:text-gold transition-colors"
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Hero section: 3 articles after lead */}
          <div className="flex flex-col divide-y divide-line-dark border-y border-line-dark lg:border-y-0">
            {heroSide.map((article, index) => (
              <ArticleCard
                key={article._id}
                article={article}
                variant="compact"
                index={index}
                className="flex-1 items-center py-4 first:pt-0 last:pb-0"
              />
            ))}
            {heroSide.length === 0 && (
              <div className="hidden p-6 lg:block">
                <p className="kicker">Editor&apos;s note</p>
                <p className="mt-3 font-body text-lg leading-relaxed text-ivory/70">
                  MIC TECH reports with precision and perspective — independent journalism for a
                  country in motion.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="wrap mt-10 lg:mt-14">
        {/* Main feed: remaining articles */}
        <SectionHeading
          eyebrow="Latest"
          title="The latest from the newsroom"
          href="/search?sort=latest"
          linkLabel="All stories"
        />
        <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {feed.map((article, index) => (
            <ArticleCard key={article._id} article={article} eager={index < 2} />
          ))}
          {feed.length < (maxFeedCount > 0 ? maxFeedCount : 8) && (
            <div className="hidden lg:block">
              <p className="kicker">Editor&apos;s note</p>
              <p className="mt-3 font-body text-lg leading-relaxed text-ivory/70">
                MIC TECH reports with precision and perspective — independent journalism for a
                country in motion.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12 border-y border-line-dark bg-surface-2/60">
        <div className="wrap grid gap-10 py-10 lg:grid-cols-[1.2fr_1fr] lg:py-14">
          <div>
            <SectionHeading eyebrow="Most read" title="What readers are following this week" />
            <div className="space-y-4">
              {trendingItems.map((article, index) => (
                <ArticleCard key={article._id} article={article} variant="ranked" index={index} />
              ))}
            </div>
            {trendingItems.length === 0 && (
              <p className="text-xs text-ivory/55 mt-4">No trending articles yet. Be the first to read.</p>
            )}
          </div>
          <aside className="border-t border-line-dark pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="kicker">The MIC TECH briefing</p>
            <h2 className="mt-2 font-display text-3xl leading-tight">One considered read, every weekday morning.</h2>
            <p className="mt-3 font-body text-[15px] leading-relaxed text-ivory/70">
              The context behind the headlines, selected by our editors. No noise, no sponsored
              filler — unsubscribe at any time.
            </p>
            <div className="mt-5">
              <NewsletterForm compact={false} />
            </div>
            <ul className="mt-6 space-y-2 text-xs text-ivory/55">
              <li className="flex items-center gap-2">
                <Icon name="check" size={13} className="text-gold" /> Independent, reader-first reporting
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={13} className="text-gold" /> Pakistan, region and world
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={13} className="text-gold" /> One email, no tracking pixels
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {/* Category navigation section */}
      {desks.filter(Boolean).length > 0 && (
        <section className="wrap mt-14">
          <SectionHeading eyebrow="Sections" title="Read by desk" href="/category/pakistan" />
          <div className="grid gap-4 md:grid-cols-4">
            {desks.map((desk) => (
              <div
                key={desk.category._id}
                className="border border-line-dark bg-surface-2/60 rounded-lg p-3 hover:bg-surface-2 transition-colors"
              >
                <Link
                  href={`/category/${desk.category.slug}`}
                  className="font-semibold text-gold hover:text-ivory transition-colors"
                >
                  {desk.category.name}
                </Link>
                <p className="mt-2 text-[10px] text-ivory/55">{desk.articles.length} stories</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search form section */}
      <section className="wrap mt-14">
        <SectionHeading eyebrow="Search" title="Find stories, topics, desks" />
        <div className="bg-surface-2/60 rounded-lg p-4 max-w-md mx-auto">
          <SearchForm compact={true} id="home-search" />
        </div>
      </section>

      {settings?.tagline ? (
        <p className="wrap mt-10 text-center font-body text-sm italic text-ivory/55">{settings.tagline}</p>
      ) : null}
    </>
  );
}