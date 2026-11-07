import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders SVG artwork as a plain image (no raster optimisation needed) and delegates
 * raster/remote media to next/image for responsive optimisation.
 */
export default function SmartImage({
  src,
  alt = "",
  className = "",
  fill = false,
  sizes = "100vw",
  priority = false,
  width,
  height,
}) {
  if (!src) {
    return (
      <span
        className={cn(
          "grid place-items-center bg-surface-2 text-gold",
          fill && "absolute inset-0 h-full w-full",
          className,
        )}
        aria-hidden="true"
      >
        <span className="font-display text-4xl opacity-60">M</span>
      </span>
    );
  }

  const isSvg = String(src).split("?")[0].toLowerCase().endsWith(".svg");
  if (isSvg) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn(fill && "absolute inset-0 h-full w-full object-cover", className)}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 500}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
