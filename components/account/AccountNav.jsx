import Link from "next/link";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookmarks", label: "Bookmarks" },
  { href: "/account/comments", label: "My comments" },
  { href: "/account/security", label: "Security" },
];

export default function AccountNav({ active }) {
  return (
    <nav aria-label="Account sections" className="flex flex-wrap gap-2 border-b border-line-dark pb-3">
      {LINKS.map((link) => {
        const isActive = active === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "bg-ink px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-soft"
                : "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55 transition-colors hover:text-gold"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
