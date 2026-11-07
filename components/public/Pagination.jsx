import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function Pagination({ page = 1, pages = 1, basePath = "/", params = {} }) {
  if (pages <= 1) return null;
  const build = (target) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    if (target > 1) query.set("page", String(target));
    const suffix = query.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  const windowStart = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => windowStart + index).filter(
    (value) => value >= 1 && value <= pages,
  );

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between border-t border-line-dark pt-5">
      {page > 1 ? (
        <Link href={build(page - 1)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] hover:text-gold">
          <Icon name="arrow-left" size={14} /> Newer
        </Link>
      ) : (
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ivory/55/40">
          <Icon name="arrow-left" size={14} /> Newer
        </span>
      )}

      <div className="flex items-center gap-1">
        {numbers.map((number) => (
          <Link
            key={number}
            href={build(number)}
            aria-current={number === page ? "page" : undefined}
            className={
              number === page
                ? "grid h-8 w-8 place-items-center bg-ink text-xs font-semibold text-ivory"
                : "grid h-8 w-8 place-items-center text-xs font-semibold text-ivory/55 hover:bg-surface-2 hover:text-ivory"
            }
          >
            {number}
          </Link>
        ))}
      </div>

      {page < pages ? (
        <Link href={build(page + 1)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] hover:text-gold">
          Older <Icon name="arrow-right" size={14} />
        </Link>
      ) : (
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ivory/55/40">
          Older <Icon name="arrow-right" size={14} />
        </span>
      )}
    </nav>
  );
}
