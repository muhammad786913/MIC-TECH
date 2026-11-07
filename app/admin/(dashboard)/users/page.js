import Link from "next/link";
import { listUsers, userStats } from "@/lib/data/users";
import { buildMetadata } from "@/lib/seo";
import UsersManager from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Readers",
  description: "Manage MIC TECH reader accounts.",
  path: "/admin/users",
  noindex: true,
});

const ROLES = ["", "user", "admin"];

export default async function AdminUsersPage({ searchParams }) {
  const query = await searchParams;
  const q = String(query?.q || "").slice(0, 80);
  const role = ROLES.includes(query?.role) ? query.role : "";
  const page = Math.max(1, Number(query?.page) || 1);
  const [result, stats] = await Promise.all([
    listUsers({ q, role, page, limit: 20 }),
    userStats(),
  ]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <header>
        <p className="kicker">Audience</p>
        <h1 className="mt-1 font-display text-4xl">Reader accounts</h1>
        <p className="mt-1 text-sm text-ivory/70">
          {stats.total} accounts · {stats.readers} readers · {stats.verified} verified. Administrator accounts are protected.
        </p>
      </header>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2 border border-line-dark bg-surface p-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="users-search" className="field-label">Search</label>
          <input id="users-search" name="q" defaultValue={q} className="input" placeholder="Name, email or username" />
        </div>
        <div>
          <label htmlFor="users-role" className="field-label">Role</label>
          <select id="users-role" name="role" defaultValue={role} className="input">
            <option value="">All roles</option>
            <option value="user">Readers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
        <button type="submit" className="btn-dark">Filter</button>
      </form>

      <div className="mt-4">
        <UsersManager users={result.items} />
      </div>

      {result.pages > 1 ? (
        <nav aria-label="User pages" className="mt-4 flex items-center justify-between text-xs">
          <p className="text-ivory/55">Page {result.page} of {result.pages}</p>
          <div className="flex gap-2">
            {result.page > 1 ? <Link href={`/admin/users?page=${result.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${role ? `&role=${role}` : ""}`} className="btn-outline">Previous</Link> : null}
            {result.page < result.pages ? <Link href={`/admin/users?page=${result.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${role ? `&role=${role}` : ""}`} className="btn-outline">Next</Link> : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
