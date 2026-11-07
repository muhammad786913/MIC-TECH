import Link from "next/link";
import { listPublished } from "@/lib/data/articles";
import { buildMetadata } from "@/lib/seo";
import ArticleCard from "@/components/public/ArticleCard";
import Pagination from "@/components/public/Pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildMetadata({
    title: "اردو ڈیسک — MIC TECH",
    description: "MIC TECH کی اردو رپورٹنگ، تجزیہ اور خبریں۔",
    path: "/urdu",
    language: "ur",
  });
}

export default async function UrduPage({ searchParams }) {
  const query = await searchParams;
  const page = Math.max(1, Number(query?.page) || 1);
  const result = await listPublished({ language: "ur", page, limit: 12 });

  return (
    <>
      <header dir="rtl" lang="ur" className="border-b border-line-dark bg-surface-2/60">
        <div className="wrap py-9 lg:py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.1em] text-ivory/55">
            <Link href="/" className="hover:text-gold">ہوم</Link>
            <span aria-hidden="true">/</span>
            <span>اردو</span>
          </nav>
          <p className="kicker mt-5 font-sans">اردو ڈیسک</p>
          <h1 className="font-urdu mt-1 text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.7]">اردو میں خبریں اور تجزیے</h1>
          <p className="mt-2 max-w-2xl font-urdu text-lg leading-[2.1] text-ivory/70">
            پاکستان، دنیا، معیشت اور ٹیکنالوجی کی کہانیاں — درست، جامع اور غیر جانبدارانہ.
          </p>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.12em] text-ivory/55">
            {result.total} {result.total === 1 ? "تحریر" : "تحریریں"}
          </p>
        </div>
      </header>

      <section className="wrap py-9 lg:py-12">
        {result.items.length ? (
          <div dir="rtl" lang="ur" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article, index) => (
              <ArticleCard key={article._id} article={article} eager={index < 3} className="text-right" />
            ))}
          </div>
        ) : (
          <div dir="rtl" lang="ur" className="mx-auto max-w-xl border border-dashed border-line-dark p-10 text-center">
            <p className="font-urdu text-2xl leading-[1.9]">ابھی اردو میں کوئی تحریر شائع نہیں ہوئی</p>
            <p className="mt-3 font-urdu text-base leading-[2] text-ivory/55">
              انگریزی کوریج پڑھیں یا بعد میں دوبارہ تشریف لائیں۔
            </p>
            <Link href="/" className="btn-outline mt-5 inline-flex font-sans">
              English edition
            </Link>
          </div>
        )}
        <div dir="rtl">
          <Pagination page={result.page} pages={result.pages} basePath="/urdu" />
        </div>
      </section>
    </>
  );
}
