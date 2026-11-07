import { newsletterStats } from "@/lib/data/comments";
import { buildMetadata } from "@/lib/seo";
import NewsletterAdminForm from "@/components/admin/NewsletterAdminForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Newsletter",
  description: "Manage the MIC TECH briefing audience.",
  path: "/admin/newsletter",
  noindex: true,
});

export default async function AdminNewsletterPage() {
  const stats = await newsletterStats();
  return (
    <div className="mx-auto max-w-[1200px]">
      <header>
        <p className="kicker">Audience</p>
        <h1 className="mt-1 font-display text-4xl">Newsletter</h1>
        <p className="mt-1 text-sm text-ivory/70">The MIC TECH briefing list, stored first-party.</p>
      </header>
      <div className="mt-6">
        <NewsletterAdminForm stats={stats} />
      </div>
    </div>
  );
}
