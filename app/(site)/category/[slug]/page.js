import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/data/categories";
import { listPublished } from "@/lib/data/articles";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";
import ArticleCard from "@/components/public/ArticleCard";
import JsonLd from "@/components/public/JsonLd";
import Pagination from "@/components/public/Pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) return buildMetadata({ title: "Section not found", path: `/category/${slug}`, noindex: true });
  return buildMetadata({
    title: `${category.name} — Latest reporting`,
    description: category.description || `Latest ${category.name} reporting and analysis from MIC TECH.`,
    path: `/category/${category.slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category || category.hidden) notFound();

  const page = Math.max(1, Number(query?.page) || 1);
  const result = await listPublished({ categorySlug: category.slug, page, limit: 12 });

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: category.name, path: `/category/${category.slug}` },
        ])}
      />
      <header className="border-b border-line-dark bg-surface-2/60">
        <div className="wrap py-9 lg:py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-ivory/55">
            <Link href="/" className="hover:text-gold">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{category.name}</span>
          </nav>
          <p className="kicker mt-5">Section</p>
          <h1 className="mt-1 font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-none">{category.name}</h1>
          {category.description ? (
            <p className="mt-3 max-w-2xl font-body text-lg leading-relaxed text-ivory/70">
              {category.description}
            </p>
          ) : null}
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-ivory/55">
            {result.total} {result.total === 1 ? "story" : "stories"}
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
            No published stories in this section yet.
          </p>
        )}
        <Pagination page={result.page} pages={result.pages} basePath={`/category/${category.slug}`} />
      </section>
    </>
  );
}
