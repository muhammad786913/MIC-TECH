import Link from "next/link";
import { listReports } from "@/lib/data/comments";
import { buildMetadata } from "@/lib/seo";
import ReportsManager from "@/components/admin/ReportsManager";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Content reports",
  description: "Review reader reports.",
  path: "/admin/reports",
  noindex: true,
});

const STATES = ["open", "resolved", "dismissed", "all"];

export default async function AdminReportsPage({ searchParams }) {
  const query = await searchParams;
  const status = STATES.includes(query?.status) ? query.status : "open";
  const reports = await listReports({ status, limit: 100 });

  return (
    <div className="mx-auto max-w-[1000px]">
      <header>
        <p className="kicker">Accountability</p>
        <h1 className="mt-1 font-display text-4xl">Reader reports</h1>
        <p className="mt-1 text-sm text-ivory/70">
          Reports concern articles, comments, misinformation, harassment, copyright or spam.
        </p>
      </header>

      <nav aria-label="Report status" className="mt-5 flex flex-wrap gap-2 border-b border-line-dark pb-3">
        {STATES.map((item) => (
          <Link
            key={item}
            href={`/admin/reports?status=${item}`}
            aria-current={status === item ? "page" : undefined}
            className={status === item ? "bg-ink px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-soft" : "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ivory/55 hover:text-gold"}
          >
            {item}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        <ReportsManager reports={reports} />
      </div>
    </div>
  );
}
