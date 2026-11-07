"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const NETWORKS = [
  {
    key: "x",
    label: "Share on X",
    icon: "xsocial",
    href: ({ url, title }) =>
      `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: "facebook",
    label: "Share on Facebook",
    icon: "facebook",
    href: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "whatsapp",
    label: "Share on WhatsApp",
    icon: "whatsapp",
    href: ({ url, title }) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    key: "linkedin",
    label: "Share on LinkedIn",
    icon: "linkedin",
    href: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

export default function ShareRail({ url, title, articleId = "", path = "" }) {
  const [copied, setCopied] = useState(false);

  function recordShare() {
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "share", path, articleId, referrer: "" }),
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {});
  }

  async function copyLink() {
    recordShare();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  const data = { url, title };

  return (
    <div className="no-print">
      <div className="flex items-center gap-2 lg:flex-col">
        <span className="mb-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-ivory/55 lg:block">
          Share
        </span>
        {NETWORKS.map((network) => (
          <a
            key={network.key}
            href={network.href(data)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={network.label}
            onClick={recordShare}
            className="grid h-9 w-9 place-items-center border border-line-dark bg-surface text-ivory/70 transition-colors hover:border-gold hover:text-gold"
          >
            <Icon name={network.icon} size={15} />
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          aria-label={copied ? "Link copied" : "Copy article link"}
          className="grid h-9 w-9 place-items-center border border-line-dark bg-surface text-ivory/70 transition-colors hover:border-gold hover:text-gold"
        >
          <Icon name={copied ? "check" : "link"} size={15} />
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </p>
    </div>
  );
}
