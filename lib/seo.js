/** SEO metadata and structured-data builders. */
import { absoluteUrl } from "@/lib/utils";
import { config } from "@/lib/config";

export const SITE = {
  name: "MIC TECH",
  tagline: "Precision. Perspective. Pakistan.",
  description: config.defaultDescription,
  locale: "en_PK",
  twitter: "@mictechnews",
  logo: "/brand/mic-tech-logo.svg",
};

export function articlePath(article) {
  return `/news/${article.slug}`;
}

/** Dynamic branded social card rendered by `app/og/route.js`. */
export function ogImage({ title, section = "", kicker = "" } = {}) {
  const params = new URLSearchParams();
  if (title) params.set("title", String(title).slice(0, 140));
  if (section) params.set("section", String(section).slice(0, 40));
  if (kicker) params.set("kicker", String(kicker).slice(0, 60));
  const query = params.toString();
  return `/og${query ? `?${query}` : ""}`;
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image = "",
  type = "website",
  publishedTime,
  modifiedTime,
  authors = [],
  section,
  tags = [],
  noindex = false,
  language = "en",
} = {}) {
  const url = absoluteUrl(path);
  const desc = String(description || SITE.description).slice(0, 300);
  // Titles that already include the brand should not receive the layout template twice.
  const titleValue =
    title && String(title).includes(SITE.name) ? { absolute: String(title) } : title;
  const meta = {
    title: titleValue,
    description: desc,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      title: title || SITE.name,
      description: desc,
      url,
      siteName: SITE.name,
      locale: language === "ur" ? "ur_PK" : SITE.locale,
      type,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors?.length ? { authors } : {}),
      ...(section ? { section } : {}),
      ...(tags?.length ? { tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title || SITE.name,
      description: desc,
      site: SITE.twitter,
    },
  };
  const socialImage =
    image || ogImage({ title: title || SITE.description, section: section || SITE.name });
  meta.openGraph.images = [{ url: absoluteUrl(socialImage), alt: title || SITE.name }];
  meta.twitter.images = [absoluteUrl(socialImage)];
  return meta;
}

export function newsArticleLd(article, { category, authorName, canonical } = {}) {
  const image = article.coverImage?.url ? [absoluteUrl(article.coverImage.url)] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || article.seo?.description || "",
    image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: [{ "@type": "Person", name: authorName || article.authorName || "MIC TECH Desk" }],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(SITE.logo),
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical || absoluteUrl(articlePath(article)) },
    articleSection: category?.name || article.categoryName || "News",
    keywords: (article.tags || []).join(", "),
    inLanguage: article.language === "ur" ? "ur-PK" : "en-PK",
    isAccessibleForFree: true,
    ...(article.sponsored
      ? {
          isPartOf: {
            "@type": "CreativeWorkSeries",
            name: "Sponsored content",
          },
        }
      : {}),
  };
}

export function breadcrumbLd(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organisationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE.name,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE.logo),
      width: 512,
      height: 512,
    },
    sameAs: [
      "https://x.com/mictechnews",
      "https://www.facebook.com/mictechnews",
      "https://www.youtube.com/@mictechnews",
    ],
    description: SITE.description,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-PK",
  };
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
