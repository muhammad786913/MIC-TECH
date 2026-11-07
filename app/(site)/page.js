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
import Icon from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "MIC TECH — News with precision and perspective",
  description:
    "Independent reporting and analysis on Pakistan, world affairs, technology, business and culture.",
  path: "/",
});

const DESK_SLUGS = ["pakistan", "world", "business"];

async function safe(promise, fallback) {
  try {
    return await promise;
  } catch (error) {
    console.warn(`[home] ${error?.message || error}`);
    return fallback;
  }
}

export default async function HomePage() {
  const [featured, latest, trending, categories, settings] = await Promise.all([
    safe(listPublished({ featured: true, limit: 8 }), { items: [] }),
    safe(listPublished({ limit: 14 }), { items: [] }),
    safe(getTrendingArticles(7, 6), []),
    safe(listCategories(), []),
    safe(getSettings(), null),
  ]);

  const pool = featured.items.length ? featured.items : latest.items;
  const lead = pool[0] || null;
  const heroSide = pool.slice(1, 4);
  const heroIds = new Set([lead?._id, ...heroSide.map((article) => article._id)].filter(Boolean));
  const feed = latest.items.filter((article) => !heroIds.has(article._id)).slice(0, 6);

  const desks = await Promise.all(
    DESK_SLUGS.map(async (slug) => {
      const category = categories.find((item) => item.slug === slug);
      if (!category) return null;
      const result = await safe(listPublished({ categorySlug: slug, limit: 3 }), { items: [] });
      if (!result.items.length) return null;
      return { category, articles: result.items };
    }),
  );

  if (!lead) {
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
          <ArticleCard article={lead} variant="lead" eager className="min-h-[420px]" />
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
            {!heroSide.length ? (
              <div className="hidden p-6 lg:block">
                <p className="kicker">Editor&apos;s note</p>
                <p className="mt-3 font-body text-lg leading-relaxed text-ivory/70">
                  MIC TECH reports with precision and perspective — independent journalism for a
                  country in motion.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="wrap mt-10 lg:mt-14">
        <SectionHeading eyebrow="Latest" title="The latest from the newsroom" href="/search?sort=latest" linkLabel="All stories" />
        <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {feed.map((article, index) => (
            <ArticleCard key={article._id} article={article} eager={index < 2} />
          ))}
        </div>
      </section>

      <section className="mt-12 border-y border-line-dark bg-surface-2/60">
        <div className="wrap grid gap-10 py-10 lg:grid-cols-[1.2fr_1fr] lg:py-14">
          <div>
            <SectionHeading eyebrow="Most read" title="What readers are following this week" />
            <div className="space-y-4">
              {trending.map((article, index) => (
                <ArticleCard key={article._id} article={article} variant="ranked" index={index} />
              ))}
            </div>
          </div>
          <aside className="border-t border-line-dark pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="kicker">The MIC TECH briefing</p>
            <h2 className="mt-2 font-display text-3xl leading-tight">
              One considered read, every weekday morning.
            </h2>
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

      {desks.filter(Boolean).map((desk, index) => (
        <section key={desk.category._id} className="wrap mt-12">
          <SectionHeading
            eyebrow="Section"
            title={desk.category.name}
            href={`/category/${desk.category.slug}`}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {desk.articles.map((article) => (
              <ArticleCard key={article._id} article={article} variant={index === 0 ? "standard" : "standard"} showExcerpt={false} />
            ))}
          </div>
          {desk.category.description ? (
            <p className="mt-4 max-w-2xl font-body text-sm text-ivory/55">{desk.category.description}</p>
          ) : null}
        </section>
      ))}

      <section className="wrap mt-14">
        <div className="grid gap-8 border border-line-dark bg-surface p-6 sm:p-9 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="kicker">Our commitment</p>
            <h2 className="mt-2 font-display text-3xl leading-tight">
              Reporting that earns its place in your day.
            </h2>
            <p className="mt-3 max-w-2xl font-body text-[15px] leading-relaxed text-ivory/70">
              MIC TECH is built around a simple standard: every story must add context, not just
              repeat a claim. Read our editorial standards, corrections policy and how we handle
              reader data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/editorial-policy" className="btn-outline">
              Editorial standards
            </Link>
            <Link href="/about" className="btn-dark">
              About the newsroom
            </Link>
          </div>
        </div>
      </section>

      {settings?.tagline ? (
        <p className="wrap mt-10 text-center font-body text-sm italic text-ivory/55">{settings.tagline}</p>
      ) : null}
    </>
  );
}
