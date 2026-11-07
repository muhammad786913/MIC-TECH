import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * MIC TECH wordmark. The owner's original logo file was not present in the workspace;
 * see docs/DECISIONS.md (D-003). The layout box is stable so the asset can be swapped.
 */
export default function Logo({ variant = "dark", className = "", compact = false }) {
  const light = variant === "light";
  return (
    <Link
      href="/"
      aria-label="MIC TECH home"
      className={cn("group inline-flex items-center gap-3", className)}
    >
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-[6px] border",
          compact ? "h-9 w-9" : "h-11 w-11 sm:h-12 sm:w-12",
          light
            ? "border-gold/70 bg-ink text-gold"
            : "border-gold/80 bg-ink text-gold",
        )}
      >
        <span
          className={cn(
            "font-display leading-none",
            compact ? "text-xl" : "text-2xl sm:text-3xl",
          )}
        >
          M
        </span>
        <span className="absolute bottom-1.5 left-1/2 h-px w-4 -translate-x-1/2 bg-gold/80" />
      </span>
      <span className="flex flex-col">
        <span className={cn("flex items-baseline gap-1.5 leading-none", compact && "gap-1")}>
          <span
            className={cn(
              "font-sans font-extrabold tracking-[0.14em]",
              compact ? "text-base" : "text-xl sm:text-2xl",
              light ? "text-ivory" : "text-ivory",
            )}
          >
            MIC
          </span>
          <span
            className={cn(
              "font-display tracking-[0.1em] text-gold",
              compact ? "text-base" : "text-xl sm:text-2xl",
            )}
          >
            TECH
          </span>
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 hidden text-[9px] font-medium uppercase tracking-[0.26em] sm:block",
              light ? "text-ivory/55" : "text-ivory/55",
            )}
          >
            Precision · Perspective
          </span>
        )}
      </span>
    </Link>
  );
}
