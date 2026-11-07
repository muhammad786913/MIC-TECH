import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function BreakingTicker({ items = [] }) {
  const list = items.slice(0, 6);
  return (
    <div className="ticker overflow-hidden border-b border-gold/25 bg-ink text-ivory">
      <div className="wrap flex items-center gap-4 py-2.5">
        <span className="flex shrink-0 items-center gap-1.5 bg-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-night">
          <Icon name="flame" size={11} strokeWidth={2} /> Breaking
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 ? "true" : undefined}>
                {list.map((item) => (
                  <Link
                    key={`${copy}-${item._id}`}
                    href={`/news/${item.slug}`}
                    className="flex shrink-0 items-center gap-4 pr-10 text-[11px] font-medium tracking-wide text-ivory/90 transition-colors hover:text-gold sm:text-xs"
                  >
                    <span className="h-1 w-1 rounded-full bg-gold" />
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <Link href="/news" className="hidden shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold sm:flex">
          All news <Icon name="arrow-right" size={12} />
        </Link>
      </div>
    </div>
  );
}
