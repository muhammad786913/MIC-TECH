import Link from "next/link";
import { notFound } from "next/navigation";
import { listPublished } from "@/lib/data/articles";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";
import { truncate } from "@/lib/utils";
import ArticleCard from "@/components/public/ArticleCard";
import JsonLd from "@/components/public/JsonLd";
import Pagination from "@/components/public/Pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildMetadata({
    title: `#${slug.replace(/-/g, " ")} — Reporting and analysis`,
    description: `MIC TECH stories tagged ${slug.replace(/-/g, " ")}.`,
    path: `/tag/${slug}`,
  });
}

export default async function TagPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  if (!/^[\p{L}\p{N}-]{1,80}$/u.test(slug)) notFound();
  const page = Math.max(1, Number(query?.page) || 1);
  const result = await listPublished({ tag: slug, page, limit: 12 });

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: `#${slug}`, path: `/tag/${slug}` },
        ])}
      />
      <header className="border-b border-line-dark bg-surface-2/60">
        <div className="wrap py-9 lg:py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-ivory/55">
            <Link href="/" className="hover:text-gold">Home</Link>
            <span aria-hidden="true">/</span>
            <span>Topic</span>
          </nav>
          <p className="kicker mt-5">Topic</p>
          <h1 className="mt-1 font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-none">
            {slug.replace(/-/g, " ")}
          </h1>
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-ivory/55">
            {result.total} {result.total === 1 ? "story" : "stories"}
          </p>
          <p className="mt-2 max-w-xl font-body text-sm text-ivory/70">
            {truncate(
              `Every MIC TECH report, analysis and dispatch filed under ${slug.replace(/-/g, " ")}.`,
              140,
            )}
          </p>
        </div>
      </header>

      <section className="wrap py-9 lg:py-12">
        {result.items.length ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article, index) => (
              <ArticleCard key={article._id} article={article} eager={index < 3} />
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-line-dark p-10 text-center font-body text-lg text-ivory/55">
            No published stories carry this topic yet.
          </p>
        )}
        <Pagination page={result.page} pages={result.pages} basePath={`/tag/${slug}`} />
      </section>
    </>
  );
}
