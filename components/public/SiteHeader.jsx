import Link from "next/link";
import { formatDate } from "@/lib/utils";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";
import SiteNav from "./SiteNav";
import BreakingTicker from "./BreakingTicker";
import SearchForm from "./SearchForm";

export default function SiteHeader({ settings, categories, breaking = [], user = null }) {
  const today = formatDate(new Date());
  return (
    <header className="bg-surface">
      <div className="border-b border-ivory/10 bg-ink text-ivory">
        <div className="wrap flex h-9 items-center justify-between gap-4 text-[10px] uppercase tracking-[0.16em]">
          <div className="flex items-center gap-4">
            <span className="text-ivory/70">{today}</span>
            <span className="hidden h-3 w-px bg-surface-2/20 sm:block" />
            <span className="hidden text-gold sm:inline">Pakistan Edition</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 text-ivory/55 md:flex">
              <Icon name="pin" size={12} className="text-gold" />
              Karachi
            </span>
            <span className="hidden h-3 w-px bg-surface-2/20 md:block" />
            <a href="/rss.xml" className="hidden items-center gap-1.5 text-ivory/60 transition-colors hover:text-gold sm:flex">
              <Icon name="rss" size={12} /> RSS
            </a>
            {user ? (
              <a href={user.role === "admin" ? "/admin" : "/account"} className="flex items-center gap-1.5 text-ivory/80 transition-colors hover:text-gold">
                <Icon name="user" size={12} className="text-gold" />
                {user.role === "admin" ? "Admin" : user.name?.split(" ")[0] || "Account"}
              </a>
            ) : (
              <a href="/login" className="flex items-center gap-1.5 text-ivory/80 transition-colors hover:text-gold">
                <Icon name="user" size={12} /> Sign in
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="wrap hidden items-center justify-between gap-8 py-5 md:flex">
        <div className="flex items-center gap-5">
          <Logo />
          <span className="hidden h-12 w-px bg-line-dark lg:block" />
          <p className="hidden max-w-[240px] font-body text-sm italic leading-snug text-ivory/55 lg:block">
            Independent journalism for a country in motion.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-[250px] xl:w-[300px]">
            <SearchForm compact id="search-header" />
          </div>
          <Link href="/#newsletter" className="btn-gold shine">
            Newsletter
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>

      <div className="wrap flex items-center justify-between py-3 md:hidden">
        <Logo compact />
        <div className="flex items-center gap-2">
          <a href="/search" aria-label="Search" className="grid h-9 w-9 place-items-center border border-line-dark">
            <Icon name="search" size={17} />
          </a>
          <a href={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"} aria-label="Account" className="grid h-9 w-9 place-items-center border border-line-dark">
            <Icon name="user" size={17} />
          </a>
        </div>
      </div>

      <SiteNav categories={categories} user={user} />

      {settings?.breakingTickerEnabled && breaking.length > 0 && (
        <BreakingTicker items={breaking} />
      )}
    </header>
  );
}

