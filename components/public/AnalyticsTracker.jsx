"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Privacy-conscious first-party pageview beacon. */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (typeof navigator === "undefined") return;
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

    const articleId =
      document.querySelector('meta[name="mic-article-id"]')?.getAttribute("content") || "";
    const payload = {
      type: "pageview",
      path: pathname,
      articleId,
      referrer: document.referrer || "",
    };

    const timer = window.setTimeout(() => {
      fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
