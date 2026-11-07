/** Block-content validation and normalisation. Structured blocks only — no raw HTML. */
import { randomUUID } from "node:crypto";
import { ValidationError, array, bool, oneOf, slug, str, url } from "@/lib/validation";
import { readingTime, slugify, truncate } from "@/lib/utils";

export const BLOCK_TYPES = [
  "text",
  "richText",
  "image",
  "gallery",
  "video",
  "pdf",
  "document",
  "quote",
  "highlight",
  "link",
  "embed",
  "divider",
];

export const BLOCK_LABELS = {
  text: "Paragraph",
  richText: "Rich text",
  image: "Image",
  gallery: "Gallery",
  video: "Video",
  pdf: "Newspaper PDF",
  document: "Document",
  quote: "Quote",
  highlight: "Highlight",
  link: "External link",
  embed: "Media embed",
  divider: "Divider",
};

export const ARTICLE_STATUSES = ["draft", "scheduled", "published", "archived"];
export const LANGUAGES = ["en"];

function id(value) {
  return typeof value === "string" && /^[a-zA-Z0-9-]{6,64}$/.test(value)
    ? value
    : randomUUID();
}

function optionalUrl(value, name) {
  return value ? url(value, name) : "";
}

function normalizeImage(value, index) {
  if (!value || typeof value !== "object") {
    throw new ValidationError(`Gallery image ${index + 1} is invalid.`);
  }
  return {
    url: url(value.url, `Gallery image ${index + 1} URL`),
    alt: str(value.alt, "Image alt text", { max: 200, optional: true }),
    caption: str(value.caption, "Caption", { max: 400, optional: true }),
    credit: str(value.credit, "Credit", { max: 200, optional: true }),
  };
}

export function normalizeBlock(block) {
  if (!block || typeof block !== "object") throw new ValidationError("Block is invalid.");
  const type = oneOf(block.type, BLOCK_TYPES, "Block type");
  const base = { id: id(block.id), type };

  switch (type) {
    case "text":
    case "richText":
      return {
        ...base,
        text: str(block.text, "Block text", { min: 1, max: 20000, trim: false }),
      };
    case "image":
      return {
        ...base,
        url: url(block.url, "Image URL"),
        alt: str(block.alt, "Alt text", { max: 200, optional: true }),
        caption: str(block.caption, "Caption", { max: 400, optional: true }),
        credit: str(block.credit, "Credit", { max: 200, optional: true }),
      };
    case "gallery": {
      const images = Array.isArray(block.images) ? block.images : [];
      if (!images.length) throw new ValidationError("A gallery needs at least one image.");
      if (images.length > 12) throw new ValidationError("A gallery can hold at most 12 images.");
      return {
        ...base,
        title: str(block.title, "Gallery title", { max: 160, optional: true }),
        images: images.map(normalizeImage),
      };
    }
    case "video":
      return {
        ...base,
        url: url(block.url, "Video URL"),
        title: str(block.title, "Video title", { max: 200, optional: true }),
        poster: optionalUrl(block.poster, "Video poster"),
        caption: str(block.caption, "Caption", { max: 400, optional: true }),
      };
    case "pdf":
    case "document":
      return {
        ...base,
        url: url(block.url, "File URL"),
        title: str(block.title, "File title", { max: 200 }),
        size: str(block.size, "File size", { max: 30, optional: true }),
        description: str(block.description, "Description", { max: 400, optional: true }),
      };
    case "quote":
      return {
        ...base,
        text: str(block.text, "Quote", { min: 2, max: 1200, trim: false }),
        attribution: str(block.attribution, "Attribution", { max: 200, optional: true }),
      };
    case "highlight":
      return {
        ...base,
        title: str(block.title, "Highlight title", { max: 160, optional: true }),
        text: str(block.text, "Highlight text", { min: 1, max: 1200 }),
      };
    case "link":
      return {
        ...base,
        url: url(block.url, "Link URL"),
        label: str(block.label, "Link label", { max: 200 }),
        description: str(block.description, "Link description", { max: 400, optional: true }),
      };
    case "embed": {
      const provider = oneOf(block.provider, ["youtube", "vimeo"], "Embed provider");
      const embedUrl = url(block.url, "Embed URL");
      assertEmbedHost(provider, embedUrl);
      return {
        ...base,
        provider,
        url: embedUrl,
        title: str(block.title, "Embed title", { max: 200, optional: true }),
      };
    }
    case "divider":
      return base;
    default:
      throw new ValidationError("Unsupported block type.");
  }
}

export function normalizeBlocks(input) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new ValidationError("Content blocks must be a list.");
  if (input.length > 120) throw new ValidationError("An article can hold at most 120 blocks.");
  return input.map(normalizeBlock);
}

function assertEmbedHost(provider, embedUrl) {
  let host = "";
  try {
    host = new URL(embedUrl).hostname.replace(/^www\./, "");
  } catch {
    throw new ValidationError("Embed URL is invalid.");
  }
  const allowed =
    provider === "youtube"
      ? ["youtube.com", "youtube-nocookie.com", "youtu.be"]
      : ["vimeo.com", "player.vimeo.com"];
  if (!allowed.some((value) => host === value || host.endsWith(`.${value}`))) {
    throw new ValidationError(`Embed URL must be a ${provider} URL.`);
  }
}

export function normalizeCover(value) {
  if (!value || typeof value !== "object" || !value.url) {
    return { url: "", alt: "", credit: "" };
  }
  return {
    url: url(value.url, "Cover image URL"),
    alt: str(value.alt, "Cover alt text", { max: 200, optional: true }),
    credit: str(value.credit, "Cover credit", { max: 200, optional: true }),
  };
}

export function normalizeSeo(value) {
  if (!value || typeof value !== "object") {
    return { title: "", description: "", canonical: "", socialImage: "", noindex: false };
  }
  return {
    title: str(value.title, "SEO title", { max: 70, optional: true }),
    description: str(value.description, "SEO description", { max: 160, optional: true }),
    canonical: optionalUrl(value.canonical, "Canonical URL"),
    socialImage: optionalUrl(value.socialImage, "Social image"),
    noindex: bool(value.noindex, false),
  };
}

export function normalizeTags(value) {
  return array(value, "Tags", { max: 10 })
    .map((tag) => slugify(tag, ""))
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index)
    .slice(0, 10);
}

export function normalizeArticleInput(payload, { partial = false } = {}) {
  const out = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key);

  if (!partial || has("title")) {
    out.title = str(payload.title, "Headline", { min: 3, max: 180 });
  }
  if (has("slug")) {
    out.slug = payload.slug ? slug(slugify(payload.slug)) : "";
  }
  if (has("subtitle") || !partial) {
    out.subtitle = str(payload.subtitle, "Standfirst", { max: 300, optional: true });
  }
  if (has("excerpt") || !partial) {
    out.excerpt = str(payload.excerpt, "Summary", { max: 500, optional: true });
  }
  if (has("language") || !partial) {
    out.language = oneOf(payload.language || "en", LANGUAGES, "Language");
  }
  if (has("categoryId") || !partial) {
    out.categoryId = str(payload.categoryId, "Category", { max: 80 });
  }
  if (has("tags") || !partial) {
    out.tags = normalizeTags(payload.tags || []);
  }
  if (has("coverImage") || !partial) {
    out.coverImage = normalizeCover(payload.coverImage);
  }
  if (has("blocks") || !partial) {
    out.blocks = normalizeBlocks(payload.blocks || []);
  }
  if (has("status") || !partial) {
    out.status = oneOf(payload.status || "draft", ARTICLE_STATUSES, "Status");
  }
  if (has("scheduledAt") || !partial) {
    out.scheduledAt = payload.scheduledAt || null;
  }
  if (has("publishedAt") || !partial) {
    out.publishedAt = payload.publishedAt || null;
  }
  for (const key of ["featured", "breaking", "sponsored"]) {
    if (has(key) || !partial) out[key] = bool(payload[key], false);
  }
  if (has("seo") || !partial) out.seo = normalizeSeo(payload.seo);

  if (out.title && !out.slug && !partial) out.slug = slugify(out.title);
  if (out.blocks) out.readingTime = readingTime(out.blocks);
  if (!out.excerpt && out.blocks) {
    const firstText = out.blocks.find((block) => block.type === "text" || block.type === "richText");
    if (firstText?.text) out.excerpt = truncate(firstText.text.replace(/[*_[\]]/g, ""), 240);
  }
  if (out.scheduledAt) {
    const date = new Date(out.scheduledAt);
    if (Number.isNaN(date.getTime())) throw new ValidationError("Schedule date is invalid.");
    out.scheduledAt = date.toISOString();
  }
  if (out.publishedAt) {
    const date = new Date(out.publishedAt);
    if (Number.isNaN(date.getTime())) throw new ValidationError("Publish date is invalid.");
    out.publishedAt = date.toISOString();
  }
  if (out.status === "scheduled" && !out.scheduledAt) {
    throw new ValidationError("Choose a publication time for scheduled articles.");
  }
  return out;
}
