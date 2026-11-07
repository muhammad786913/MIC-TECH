import Link from "next/link";
import { listAdminComments, commentStats } from "@/lib/data/comments";
import { buildMetadata } from "@/lib/seo";
import CommentsModeration from "@/components/admin/CommentsModeration";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Comments",
  description: "Moderate MIC TECH comments.",
  path: "/admin/comments",
  noindex: true,
});

const STATES = ["pending", "approved", "rejected", "all"];

export default async function AdminCommentsPage({ searchParams }) {
  const query = await searchParams;
  const status = STATES.includes(query?.status) ? query.status : "pending";
  const page = Math.max(1, Number(query?.page) || 1);
  const [result, stats] = await Promise.all([
    listAdminComments({ status, page, limit: 25 }),
    commentStats(),
  ]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <header>
        <p className="kicker">Moderation</p>
        <h1 className="mt-1 font-display text-4xl">Comments</h1>
        <p className="mt-1 text-sm text-ivory/70">
          {stats.pending} pending · {stats.approved} approved · {stats.rejected} rejected
        </p>
      </header>

      <nav aria-label="Comment status" className="mt-5 flex flex-wrap gap-2 border-b border-line-dark pb-3">
        {STATES.map((item) => (
          <Link
            key={item}
            href={`/admin/comments?status=${item}`}
            aria-current={status === item ? "page" : undefined}
            className={status === item ? "bg-ink px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-soft" : "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ivory/55 hover:text-gold"}
          >
            {item} {item === "pending" && stats.pending ? `(${stats.pending})` : ""}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        <CommentsModeration items={result.items} />
      </div>

      {result.pages > 1 ? (
        <nav aria-label="Comment pages" className="mt-4 flex items-center justify-between text-xs">
          <p className="text-ivory/55">Page {result.page} of {result.pages}</p>
          <div className="flex gap-2">
            {result.page > 1 ? <Link href={`/admin/comments?status=${status}&page=${result.page - 1}`} className="btn-outline">Previous</Link> : null}
            {result.page < result.pages ? <Link href={`/admin/comments?status=${status}&page=${result.page + 1}`} className="btn-outline">Next</Link> : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
