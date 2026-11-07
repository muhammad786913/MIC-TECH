import Link from "next/link";
import { listPublished, allPublishedTags } from "@/lib/data/articles";
import { buildMetadata } from "@/lib/seo";
import ArticleCard from "@/components/public/ArticleCard";
import Pagination from "@/components/public/Pagination";
import SearchForm from "@/components/public/SearchForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const q = String(query?.q || "").trim().slice(0, 80);
  return buildMetadata({
    title: q ? `Search: ${q}` : "Search MIC TECH",
    description: "Search reporting, analysis and dispatches across every MIC TECH desk.",
    path: q ? `/search?q=${encodeURIComponent(q)}` : "/search",
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }) {
  const query = await searchParams;
  const q = String(query?.q || "").trim().slice(0, 80);
  const sort = query?.sort === "oldest" ? "oldest" : "latest";
  const page = Math.max(1, Number(query?.page) || 1);

  const [result, tags] = await Promise.all([
    q
      ? listPublished({ q, page, limit: 12, sort })
      : Promise.resolve({ items: [], total: 0, page: 1, pages: 1 }),
    allPublishedTags(14).catch(() => []),
  ]);

  return (
    <>
      <header className="border-b border-line-dark bg-surface-2/60">
        <div className="wrap py-9 lg:py-12">
          <p className="kicker">Search</p>
          <h1 className="mt-1 font-display text-[clamp(2.1rem,4.6vw,3.5rem)] leading-none">
            Find the story behind the headline
          </h1>
          <div className="mt-5 max-w-xl">
            <SearchForm id="search-page" />
          </div>
          {q ? (
            <p className="mt-4 text-sm text-ivory/55">
              {result.total} {result.total === 1 ? "result" : "results"} for{" "}
              <span className="font-semibold text-ivory">“{q}”</span>
            </p>
          ) : null}
        </div>
      </header>

      <section className="wrap py-9 lg:py-12">
        {q ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-dark pb-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ivory/55">
                Sorted by {sort === "oldest" ? "oldest first" : "newest first"}
              </p>
              <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-[0.1em]">
                <Link
                  href={`/search?q=${encodeURIComponent(q)}&sort=latest`}
                  className={sort === "latest" ? "text-gold" : "text-ivory/55 hover:text-ivory"}
                >
                  Newest
                </Link>
                <Link
                  href={`/search?q=${encodeURIComponent(q)}&sort=oldest`}
                  className={sort === "oldest" ? "text-gold" : "text-ivory/55 hover:text-ivory"}
                >
                  Oldest
                </Link>
              </div>
            </div>

            {result.items.length ? (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((article, index) => (
                  <ArticleCard key={article._id} article={article} eager={index < 3} />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-lg border border-dashed border-line-dark p-10 text-center">
                <p className="font-display text-2xl">Nothing matched that search</p>
                <p className="mt-2 font-body text-sm text-ivory/70">
                  Try a broader phrase, a desk name, or browse the topics below.
                </p>
              </div>
            )}

            <Pagination
              page={result.page}
              pages={result.pages}
              basePath="/search"
              params={{ q, sort }}
            />
          </>
        ) : (
          <div className="mx-auto max-w-2xl">
            <p className="font-body text-lg leading-relaxed text-ivory/70">
              Type a name, place, policy or phrase. Search covers every published report, analysis
              and dispatch in the newsroom.
            </p>
            {tags.length ? (
              <div className="mt-6">
                <p className="kicker mb-3">Popular topics</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((item) => (
                    <Link key={item.tag} href={`/tag/${item.tag}`} className="chip">
                      {item.tag.replace(/-/g, " ")} <span className="text-ivory/55/60">{item.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}
