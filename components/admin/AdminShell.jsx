"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "layers" },
  { href: "/admin/analytics", label: "Analytics", icon: "trend" },
  { href: "/admin/articles", label: "Articles", icon: "edit" },
  { href: "/admin/media", label: "Media", icon: "image" },
  { href: "/admin/categories", label: "Categories", icon: "folder" },
  { href: "/admin/comments", label: "Comments", icon: "comment" },
  { href: "/admin/reports", label: "Reports", icon: "alert" },
  { href: "/admin/users", label: "Readers", icon: "users" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "mail" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/audit", label: "Audit log", icon: "shield" },
];

function isActive(pathname, href) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ user, badges = {}, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside
        className={`${open ? "block" : "hidden"} border-r border-line-dark bg-ink text-ivory lg:block`}
      >
        <div className="flex h-16 items-center justify-between border-b border-ivory/10 px-5">
          <Logo variant="light" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-ivory/60 lg:hidden"
            aria-label="Close navigation"
          >
            Ã—
          </button>
        </div>
        <nav aria-label="Admin sections" className="px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const badge = badges[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`mb-0.5 flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                  active ? "bg-surface/10 text-gold" : "text-ivory/65 hover:bg-surface/5 hover:text-ivory"
                }`}
              >
                <Icon name={item.icon} size={15} />
                <span className="flex-1">{item.label}</span>
                {badge ? (
                  <span className="bg-gold px-1.5 py-0.5 text-[9px] font-bold text-night">{badge}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-ivory/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ivory/40">Signed in</p>
          <p className="mt-1 truncate text-sm text-ivory/85">{user.name}</p>
          <p className="truncate text-[11px] text-ivory/45">{user.email}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" className="flex-1 border border-ivory/15 px-2 py-1.5 text-center text-[10px] uppercase tracking-[0.1em] text-ivory/70 hover:border-gold hover:text-gold">
              View site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex-1 border border-ivory/15 px-2 py-1.5 text-[10px] uppercase tracking-[0.1em] text-ivory/70 hover:border-gold hover:text-gold"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center gap-3 border-b border-line-dark bg-surface px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-line-dark px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] lg:hidden"
            aria-label="Open navigation"
          >
            Menu
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ivory/55">
              MIC TECH Newsroom
            </p>
            <p className="truncate font-display text-lg leading-tight">Editorial control room</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/articles/new" className="btn-gold hidden sm:inline-flex">
              + New story
            </Link>
            <Link
              href="/admin/articles/new"
              className="btn-gold px-2 py-2 text-xs sm:hidden"
              aria-label="New story"
            >
              +
            </Link>
          </div>
        </header>
        <main id="main-content" className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

