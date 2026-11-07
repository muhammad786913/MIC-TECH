import Link from "next/link";
import Icon from "@/components/ui/Icon";
import SmartImage from "./SmartImage";
import { cn, truncate } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

function CategoryTag({ article, light = false, className = "" }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.16em]",
        light ? "text-gold-soft" : "text-gold",
        className,
      )}
    >
      {article.categoryName || "News"}
      {article.sponsored ? <span className="ml-2 text-ivory/55">· Sponsored</span> : null}
    </span>
  );
}

function Meta({ article, light = false, className = "" }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]",
        light ? "text-ivory/65" : "text-ivory/55",
        className,
      )}
    >
      <span>{timeAgo(article.publishedAt)}</span>
      {article.readingTime ? (
        <>
          <span className="h-1 w-1 rounded-full bg-gold/70" aria-hidden="true" />
          <span>{article.readingTime} min read</span>
        </>
      ) : null}
      {article.breaking ? (
        <>
          <span className="h-1 w-1 rounded-full bg-gold/70" aria-hidden="true" />
          <span className="font-semibold uppercase tracking-[0.12em] text-gold">Breaking</span>
        </>
      ) : null}
    </div>
  );
}

export default function ArticleCard({
  article,
  variant = "standard",
  index,
  eager = false,
  showExcerpt = true,
  className = "",
}) {
  if (!article) return null;
  const href = `/news/${article.slug}`;
  const image = article.coverImage?.url;

  if (variant === "lead") {
    return (
      <article className={cn("group relative isolate overflow-hidden bg-ink", className)}>
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[540px]">
          <SmartImage
            src={image}
            alt={article.coverImage?.alt || article.title}
            fill
            priority={eager}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/5" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-9">
          <div className="mb-3 flex items-center gap-3">
            <span className="bg-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-night">
              {article.categoryName || "News"}
            </span>
            {article.breaking && (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gold-soft">
                <Icon name="flame" size={11} /> Breaking
              </span>
            )}
          </div>
          <h2 className={cn("headline max-w-3xl text-[clamp(1.75rem,4.2vw,3.5rem)] text-ivory")}>
            <Link href={href}>{article.title}</Link>
          </h2>
          {article.subtitle && (
            <p className="mt-3 hidden max-w-2xl font-body text-base leading-relaxed text-ivory/75 sm:block">
              {truncate(article.subtitle, 170)}
            </p>
          )}
          <Meta article={article} light className="mt-4" />
        </div>
      </article>
    );
  }

  if (variant === "overlay") {
    return (
      <article className={cn("group relative isolate overflow-hidden bg-ink", className)}>
        <div className="relative aspect-[16/10] w-full">
          <SmartImage
            src={image}
            alt={article.coverImage?.alt || article.title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <CategoryTag article={article} light />
          <h3 className={cn("headline mt-1.5 text-xl text-ivory sm:text-2xl")}>
            <Link href={href}>{article.title}</Link>
          </h3>
          <Meta article={article} light className="mt-2" />
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("group flex gap-3.5", className)}>
        <div className="relative h-[76px] w-[104px] shrink-0 overflow-hidden bg-surface-2 sm:h-[88px] sm:w-[124px]">
          <SmartImage
            src={image}
            alt={article.coverImage?.alt || article.title}
            fill
            sizes="124px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 self-center">
          <CategoryTag article={article} className="text-[9px]" />
          <h3 className={cn("mt-1 font-display text-[15px] font-semibold leading-snug tracking-tight")}>
            <Link href={href} className="transition-colors hover:text-gold">
              {article.title}
            </Link>
          </h3>
          <p className="mt-1.5 text-[10px] text-ivory/55">{timeAgo(article.publishedAt)}</p>
        </div>
      </article>
    );
  }

  if (variant === "ranked") {
    return (
      <article className={cn("group flex items-start gap-3.5 border-b border-line-dark pb-4", className)}>
        <span className="mt-0.5 w-7 shrink-0 font-display text-2xl leading-none text-gold">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <CategoryTag article={article} className="text-[9px]" />
          <h3 className={cn("mt-1 font-display text-[15px] font-semibold leading-snug")}>
            <Link href={href} className="transition-colors hover:text-gold">
              {article.title}
            </Link>
          </h3>
          <p className="mt-1.5 text-[10px] text-ivory/55">{timeAgo(article.publishedAt)}</p>
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className={cn("group grid gap-4 sm:grid-cols-[1.1fr_1fr] sm:items-center", className)}>
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
          <SmartImage
            src={image}
            alt={article.coverImage?.alt || article.title}
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div>
          <CategoryTag article={article} />
          <h3 className={cn("headline mt-1.5 text-2xl sm:text-[26px]")}>
            <Link href={href}>{article.title}</Link>
          </h3>
          {article.excerpt && (
            <p className="mt-2 line-clamp-3 font-body text-sm leading-relaxed text-ivory/70">
              {article.excerpt}
            </p>
          )}
          <Meta article={article} className="mt-3" />
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <SmartImage
          src={image}
          alt={article.coverImage?.alt || article.title}
          fill
          eager={eager}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {article.breaking && (
          <span className="absolute left-3 top-3 bg-ink/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold-soft">
            Breaking
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-3.5">
        <CategoryTag article={article} />
        <h3 className={cn("headline mt-1.5 text-xl leading-tight sm:text-[22px]")}>
          <Link href={href}>{article.title}</Link>
        </h3>
        {showExcerpt && article.excerpt && (
          <p className="mt-2 line-clamp-2 font-body text-[14px] leading-relaxed text-ivory/70">
            {article.excerpt}
          </p>
        )}
        <Meta article={article} className="mt-auto pt-3" />
      </div>
    </article>
  );
}
