import { listPublished } from "@/lib/data/articles";
import { absoluteUrl } from "@/lib/utils";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toUTCString();
  return date.toUTCString();
}

export async function GET() {
  let articles = [];
  try {
    const result = await listPublished({ limit: 50, sort: "latest" });
    articles = result.items || [];
  } catch (error) {
    console.warn(`[rss] articles unavailable: ${error?.message || error}`);
  }

  const items = articles
    .filter((article) => article.slug && !article.seo?.noindex)
    .map((article) => {
      const link = absoluteUrl(article.seo?.canonical || `/news/${article.slug}`);
      const description = article.seo?.description || article.excerpt || "";
      const categories = [article.categoryName, ...(article.tags || [])]
        .filter(Boolean)
        .map((name) => `      <category>${escapeXml(name)}</category>`)
        .join("\n");
      return [
        "    <item>",
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${rfc822(article.publishedAt)}</pubDate>`,
        `      <dc:creator>${escapeXml(article.authorName || "MIC TECH Desk")}</dc:creator>`,
        `      <description>${escapeXml(description)}</description>`,
        categories,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en-pk</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=1200",
    },
  });
}
