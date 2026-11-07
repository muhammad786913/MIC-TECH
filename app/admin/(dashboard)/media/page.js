import Link from "next/link";
import { listMedia } from "@/lib/media";
import { buildMetadata } from "@/lib/seo";
import MediaManager from "@/components/admin/MediaManager";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Media library",
  description: "Manage MIC TECH media.",
  path: "/admin/media",
  noindex: true,
});

export default async function AdminMediaPage({ searchParams }) {
  const query = await searchParams;
  const q = String(query?.q || "").slice(0, 80);
  const type = ["image", "video", "pdf", "document"].includes(query?.type) ? query.type : "";
  const page = Math.max(1, Number(query?.page) || 1);
  const result = await listMedia({ page, type, q, limit: 24 });

  return (
    <div className="mx-auto max-w-[1400px]">
      <header>
        <p className="kicker">Assets</p>
        <h1 className="mt-1 font-display text-4xl">Media library</h1>
        <p className="mt-1 text-sm text-ivory/70">{result.total} files. Cloudinary in production; local uploads in development.</p>
      </header>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2 border border-line-dark bg-surface p-4">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="media-search" className="field-label">Search</label>
          <input id="media-search" name="q" defaultValue={q} className="input" placeholder="File name or alt text" />
        </div>
        <div>
          <label htmlFor="media-type" className="field-label">Type</label>
          <select id="media-type" name="type" defaultValue={type} className="input">
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="document">Documents</option>
          </select>
        </div>
        <button type="submit" className="btn-dark">Filter</button>
        {q || type ? <Link href="/admin/media" className="px-2 py-2 text-[11px] uppercase tracking-[0.1em] text-ivory/55 hover:text-gold">Reset</Link> : null}
      </form>

      <div className="mt-4">
        <MediaManager items={result.items} />
      </div>

      {result.pages > 1 ? (
        <nav aria-label="Media pages" className="mt-4 flex items-center justify-between text-xs">
          <p className="text-ivory/55">Page {result.page} of {result.pages}</p>
          <div className="flex gap-2">
            {result.page > 1 ? <Link href={`/admin/media?page=${result.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${type ? `&type=${type}` : ""}`} className="btn-outline">Previous</Link> : null}
            {result.page < result.pages ? <Link href={`/admin/media?page=${result.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${type ? `&type=${type}` : ""}`} className="btn-outline">Next</Link> : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
