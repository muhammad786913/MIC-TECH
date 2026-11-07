import { requireAdmin } from "@/lib/auth/guards";
import { commentStats } from "@/lib/data/comments";
import { listReports } from "@/lib/data/comments";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const user = await requireAdmin();
  const [comments, reports] = await Promise.all([
    commentStats().catch(() => ({ pending: 0 })),
    listReports({ status: "open", limit: 100 }).catch(() => []),
  ]);

  return (
    <AdminShell
      user={user}
      badges={{
        "/admin/comments": comments.pending || 0,
        "/admin/reports": reports.length || 0,
      }}
    >
      {children}
    </AdminShell>
  );
}
