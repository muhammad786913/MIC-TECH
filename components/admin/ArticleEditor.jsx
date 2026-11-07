"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BLOCK_LABELS, BLOCK_TYPES, LANGUAGES } from "@/lib/content";
import MediaField from "./MediaField";

const EMPTY_BY_TYPE = {
  text: { text: "" },
  richText: { text: "" },
  image: { url: "", alt: "", caption: "", credit: "" },
  gallery: { title: "", images: [{ url: "", alt: "", caption: "", credit: "" }] },
  video: { url: "", title: "", poster: "", caption: "" },
  pdf: { url: "", title: "", size: "", description: "" },
  document: { url: "", title: "", size: "", description: "" },
  quote: { text: "", attribution: "" },
  highlight: { title: "", text: "" },
  link: { url: "", label: "", description: "" },
  embed: { provider: "youtube", url: "", title: "" },
  divider: {},
};

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanBlocks(blocks) {
  return blocks.filter((block) => {
    if (block.type === "divider") return true;
    if (block.type === "gallery") {
      return (block.images || []).some((image) => String(image.url || "").trim());
    }
    if (["text", "richText", "quote", "highlight"].includes(block.type)) {
      return String(block.text || "").trim().length > 0;
    }
    if (block.type === "embed") return String(block.url || "").trim().length > 0;
    if (block.type === "link") {
      return String(block.url || "").trim() && String(block.label || "").trim();
    }
    if (block.type === "pdf" || block.type === "document") {
      return String(block.url || "").trim() && String(block.title || "").trim();
    }
    return String(block.url || "").trim().length > 0;
  });
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function BlockFields({ block, update }) {
  const set = (patch) => update({ ...block, ...patch });

  switch (block.type) {
    case "text":
      return (
        <textarea
          className="input min-h-[110px]"
          placeholder="Write the paragraph. Separate paragraphs with a blank line."
          value={block.text || ""}
          onChange={(event) => set({ text: event.target.value })}
        />
      );
    case "richText":
      return (
        <div>
          <textarea
            className="input min-h-[130px]"
            placeholder="Rich paragraph with **bold**, *italic*, `code` and [links](https://example.com)."
            value={block.text || ""}
            onChange={(event) => set({ text: event.target.value })}
          />
          <p className="mt-1 text-[11px] text-ivory/55">
            Supports **bold**, *italic*, `code`, and [label](https://example.com). Raw HTML is never rendered.
          </p>
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <MediaField value={block.url} onChange={(url) => set({ url })} label="Image" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Alt text (required for accessibility)" value={block.alt || ""} onChange={(event) => set({ alt: event.target.value })} />
            <input className="input" placeholder="Credit" value={block.credit || ""} onChange={(event) => set({ credit: event.target.value })} />
          </div>
          <input className="input" placeholder="Caption" value={block.caption || ""} onChange={(event) => set({ caption: event.target.value })} />
        </div>
      );
    case "gallery": {
      const images = block.images || [];
      return (
        <div className="space-y-2">
          <input className="input" placeholder="Gallery title" value={block.title || ""} onChange={(event) => set({ title: event.target.value })} />
          {images.map((image, index) => (
            <div key={index} className="border border-line-dark p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ivory/55">Image {index + 1}</p>
                <button
                  type="button"
                  className="text-[11px] text-red-400"
                  onClick={() => set({ images: images.filter((_, i) => i !== index) })}
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 space-y-2">
                <MediaField
                  value={image.url}
                  onChange={(url) => set({ images: images.map((item, i) => (i === index ? { ...item, url } : item)) })}
                  label="Image URL"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="input" placeholder="Alt text" value={image.alt || ""} onChange={(event) => set({ images: images.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)) })} />
                  <input className="input" placeholder="Credit" value={image.credit || ""} onChange={(event) => set({ images: images.map((item, i) => (i === index ? { ...item, credit: event.target.value } : item)) })} />
                </div>
                <input className="input" placeholder="Caption" value={image.caption || ""} onChange={(event) => set({ images: images.map((item, i) => (i === index ? { ...item, caption: event.target.value } : item)) })} />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn-outline"
            onClick={() => set({ images: [...images, { url: "", alt: "", caption: "", credit: "" }] })}
          >
            + Add image
          </button>
        </div>
      );
    }
    case "video":
      return (
        <div className="space-y-2">
          <MediaField value={block.url} onChange={(url) => set({ url })} label="Video file (MP4)" accept="video/mp4" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Video title" value={block.title || ""} onChange={(event) => set({ title: event.target.value })} />
            <input className="input" placeholder="Poster image URL" value={block.poster || ""} onChange={(event) => set({ poster: event.target.value })} />
          </div>
          <input className="input" placeholder="Caption" value={block.caption || ""} onChange={(event) => set({ caption: event.target.value })} />
        </div>
      );
    case "pdf":
    case "document":
      return (
        <div className="space-y-2">
          <MediaField
            value={block.url}
            onChange={(url) => set({ url })}
            label={block.type === "pdf" ? "PDF file" : "Document file"}
            accept={block.type === "pdf" ? "application/pdf" : "application/pdf,image/*"}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="File title (required)" value={block.title || ""} onChange={(event) => set({ title: event.target.value })} />
            <input className="input" placeholder="Size label, e.g. 2.4 MB" value={block.size || ""} onChange={(event) => set({ size: event.target.value })} />
          </div>
          <input className="input" placeholder="Description" value={block.description || ""} onChange={(event) => set({ description: event.target.value })} />
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <textarea className="input min-h-[90px]" placeholder="Quote text" value={block.text || ""} onChange={(event) => set({ text: event.target.value })} />
          <input className="input" placeholder="Attribution" value={block.attribution || ""} onChange={(event) => set({ attribution: event.target.value })} />
        </div>
      );
    case "highlight":
      return (
        <div className="space-y-2">
          <input className="input" placeholder="Highlight title" value={block.title || ""} onChange={(event) => set({ title: event.target.value })} />
          <textarea className="input min-h-[80px]" placeholder="Highlight text" value={block.text || ""} onChange={(event) => set({ text: event.target.value })} />
        </div>
      );
    case "link":
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="https://example.com" value={block.url || ""} onChange={(event) => set({ url: event.target.value })} />
            <input className="input" placeholder="Link label" value={block.label || ""} onChange={(event) => set({ label: event.target.value })} />
          </div>
          <input className="input" placeholder="Description" value={block.description || ""} onChange={(event) => set({ description: event.target.value })} />
        </div>
      );
    case "embed":
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
            <select className="input" value={block.provider || "youtube"} onChange={(event) => set({ provider: event.target.value })}>
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
            <input className="input" placeholder="https://www.youtube.com/watch?v=…" value={block.url || ""} onChange={(event) => set({ url: event.target.value })} />
          </div>
          <input className="input" placeholder="Embed title" value={block.title || ""} onChange={(event) => set({ title: event.target.value })} />
          <p className="text-[11px] text-ivory/55">Only YouTube and Vimeo embed URLs are accepted.</p>
        </div>
      );
    case "divider":
      return <p className="text-xs text-ivory/55">A horizontal rule will appear at this point.</p>;
    default:
      return null;
  }
}

export default function ArticleEditor({ article = null, categories = [] }) {
  const router = useRouter();
  const isNew = !article;
  const [meta, setMeta] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    subtitle: article?.subtitle || "",
    excerpt: article?.excerpt || "",
    language: article?.language || "en",
    categoryId: article?.categoryId || categories[0]?._id || "",
    tags: (article?.tags || []).join(", "),
    coverUrl: article?.coverImage?.url || "",
    coverAlt: article?.coverImage?.alt || "",
    coverCredit: article?.coverImage?.credit || "",
    status: article?.status || "draft",
    scheduledAt: toLocalInput(article?.scheduledAt),
    featured: Boolean(article?.featured),
    breaking: Boolean(article?.breaking),
    sponsored: Boolean(article?.sponsored),
    seoTitle: article?.seo?.title || "",
    seoDescription: article?.seo?.description || "",
    canonical: article?.seo?.canonical || "",
    socialImage: article?.seo?.socialImage || "",
    noindex: Boolean(article?.seo?.noindex),
  });
  const [blocks, setBlocks] = useState(
    article?.blocks?.length
      ? article.blocks.map((block) => ({ ...block, images: block.images ? [...block.images] : undefined }))
      : [{ id: newId(), type: "text", text: "" }],
  );
  const [state, setState] = useState({ status: "idle", message: "", errors: {} });
  const [addType, setAddType] = useState("text");
  const busy = state.status === "saving";

  const set = (patch) => setMeta((current) => ({ ...current, ...patch }));
  const updateBlock = (index, next) =>
    setBlocks((current) => current.map((block, i) => (i === index ? next : block)));

  function addBlock() {
    setBlocks((current) => [...current, { id: newId(), type: addType, ...EMPTY_BY_TYPE[addType] }]);
  }

  function move(index, direction) {
    setBlocks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index) {
    setBlocks((current) => current.filter((_, i) => i !== index));
  }

  async function save({ overrideStatus } = {}) {
    const status = overrideStatus || meta.status;
    if (!meta.title.trim()) {
      setState({ status: "error", message: "Add a headline before saving.", errors: {} });
      return;
    }
    if (!meta.categoryId) {
      setState({ status: "error", message: "Choose a category.", errors: {} });
      return;
    }
    if (status === "scheduled" && !meta.scheduledAt) {
      setState({ status: "error", message: "Choose a publication time before scheduling.", errors: {} });
      return;
    }
    setState({ status: "saving", message: "", errors: {} });

    const payload = {
      title: meta.title,
      slug: meta.slug || undefined,
      subtitle: meta.subtitle,
      excerpt: meta.excerpt,
      language: meta.language,
      categoryId: meta.categoryId,
      tags: meta.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      coverImage: meta.coverUrl
        ? { url: meta.coverUrl, alt: meta.coverAlt, credit: meta.coverCredit }
        : { url: "", alt: "", credit: "" },
      blocks: cleanBlocks(blocks).map((block) => {
        const copy = { ...block };
        delete copy.images;
        if (block.images) copy.images = block.images.filter((image) => image.url);
        return copy;
      }),
      status,
      scheduledAt: status === "scheduled" ? new Date(meta.scheduledAt).toISOString() : null,
      featured: meta.featured,
      breaking: meta.breaking,
      sponsored: meta.sponsored,
      seo: {
        title: meta.seoTitle,
        description: meta.seoDescription,
        canonical: meta.canonical,
        socialImage: meta.socialImage,
        noindex: meta.noindex,
      },
    };

    try {
      const response = await fetch(
        isNew ? "/api/admin/articles" : `/api/admin/articles/${article._id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fieldError = data.fields ? Object.values(data.fields)[0] : "";
        throw new Error(fieldError || data.error || "Could not save the article.");
      }
      setState({ status: "saved", message: `Saved as ${data.article.status}.`, errors: {} });
      setMeta((current) => ({ ...current, status: data.article.status }));
      if (isNew) {
        router.push(`/admin/articles/${data.article._id}`);
      }
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message, errors: {} });
    }
  }

  async function removeArticle() {
    if (!window.confirm("Delete this article? It will be removed from the public site.")) return;
    setState({ status: "saving", message: "", errors: {} });
    try {
      const response = await fetch(`/api/admin/articles/${article._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not delete the article.");
      router.push("/admin/articles");
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message, errors: {} });
    }
  }

  const wordCount = useMemo(
    () =>
      cleanBlocks(blocks)
        .map((block) => block.text || "")
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length,
    [blocks],
  );

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-dark pb-4">
        <div>
          <p className="kicker">{isNew ? "New story" : "Editing"}</p>
          <h1 className="mt-1 max-w-2xl font-display text-3xl leading-tight">
            {meta.title || "Untitled story"}
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ivory/55">
            {meta.status} Â· {wordCount} words Â· {blocks.length} blocks
            {article?.updatedAt ? ` Â· updated ${new Date(article.updatedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew ? (
            <>
              <Link href={`/admin/articles/${article._id}/preview`} target="_blank" className="btn-outline">
                Preview
              </Link>
              <Link href={`/news/${article.slug}`} target="_blank" className="btn-outline">
                View live
              </Link>
            </>
          ) : null}
          <select
            className="input w-auto"
            aria-label="Article status"
            value={meta.status}
            onChange={(event) => set({ status: event.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
          <button type="button" onClick={() => save()} disabled={busy} className="btn-gold disabled:opacity-60">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {state.message ? (
        <p
          role="status"
          className={`mt-4 border p-3 text-sm ${
            state.status === "error" ? "border-red-500/30 bg-red-900/10 text-red-400" : "border-gold/40 bg-surface-2/60 text-ivory/70"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="border border-line-dark bg-surface p-5">
            <div className="space-y-3">
              <div>
                <label htmlFor="article-title" className="field-label">Headline</label>
                <input
                  id="article-title"
                  className="input font-display text-xl"
                  value={meta.title}
                  onChange={(event) => set({ title: event.target.value })}
                  maxLength={180}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="article-slug" className="field-label">URL slug (optional)</label>
                  <input
                    id="article-slug"
                    className="input"
                    value={meta.slug}
                    onChange={(event) => set({ slug: event.target.value })}
                    placeholder="auto-generated from headline"
                  />
                </div>
                <div>
                  <label htmlFor="article-language" className="field-label">Language</label>
                  <select id="article-language" className="input" value={meta.language} onChange={(event) => set({ language: event.target.value })}>
                    {LANGUAGES.map((language) => (
                      <option key={language} value={language}>{language === "ur" ? "Urdu (Ø§Ø±Ø¯Ùˆ)" : "English"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="article-subtitle" className="field-label">Standfirst</label>
                <textarea id="article-subtitle" className="input min-h-[64px]" maxLength={300} value={meta.subtitle} onChange={(event) => set({ subtitle: event.target.value })} />
              </div>
              <div>
                <label htmlFor="article-excerpt" className="field-label">Summary</label>
                <textarea id="article-excerpt" className="input min-h-[64px]" maxLength={500} value={meta.excerpt} onChange={(event) => set({ excerpt: event.target.value })} placeholder="Used in cards, search and social previews." />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="article-category" className="field-label">Category</label>
                  <select id="article-category" className="input" value={meta.categoryId} onChange={(event) => set({ categoryId: event.target.value })}>
                    <option value="">Choose…</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="article-tags" className="field-label">Tags (comma separated)</label>
                  <input id="article-tags" className="input" value={meta.tags} onChange={(event) => set({ tags: event.target.value })} placeholder="pakistan, economy, analysis" />
                </div>
              </div>
            </div>
          </section>

          <section className="border border-line-dark bg-surface p-5">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line-dark pb-3">
              <div>
                <p className="kicker">Content</p>
                <h2 className="font-display text-xl">Story blocks</h2>
              </div>
              <div className="flex gap-2">
                <select className="input w-auto" aria-label="Block type" value={addType} onChange={(event) => setAddType(event.target.value)}>
                  {BLOCK_TYPES.map((type) => (
                    <option key={type} value={type}>{BLOCK_LABELS[type]}</option>
                  ))}
                </select>
                <button type="button" className="btn-outline whitespace-nowrap" onClick={addBlock}>+ Add block</button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {blocks.map((block, index) => (
                <div key={block.id || index} className="border border-line-dark">
                  <div className="flex flex-wrap items-center gap-2 border-b border-line-dark bg-surface-2/50 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ivory/55">
                      {index + 1}. {BLOCK_LABELS[block.type] || block.type}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="px-2 py-0.5 text-xs text-ivory/55 disabled:opacity-30" aria-label="Move block up">â†‘</button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === blocks.length - 1} className="px-2 py-0.5 text-xs text-ivory/55 disabled:opacity-30" aria-label="Move block down">â†“</button>
                      <button type="button" onClick={() => remove(index)} className="px-2 py-0.5 text-xs text-red-400" aria-label="Remove block">Remove</button>
                    </div>
                  </div>
                  <div className="p-3">
                    <BlockFields block={block} update={(next) => updateBlock(index, next)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="border border-line-dark bg-surface p-5">
            <h2 className="font-display text-lg">Publishing</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="article-schedule" className="field-label">Schedule (local time)</label>
                <input id="article-schedule" type="datetime-local" className="input" value={meta.scheduledAt} onChange={(event) => set({ scheduledAt: event.target.value })} />
              </div>
              <div className="space-y-2">
                {[
                  ["featured", "Feature on homepage"],
                  ["breaking", "Breaking news ticker"],
                  ["sponsored", "Sponsored content label"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-ivory/70">
                    <input type="checkbox" checked={meta[key]} onChange={(event) => set({ [key]: event.target.checked })} className="h-4 w-4 accent-[#C5A24B]" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-line-dark pt-3">
                <button type="button" onClick={() => save({ overrideStatus: "published" })} disabled={busy} className="btn-gold disabled:opacity-60">
                  Publish now
                </button>
                <button type="button" onClick={() => save({ overrideStatus: "scheduled" })} disabled={busy} className="btn-outline disabled:opacity-60">
                  Schedule
                </button>
              </div>
              {!isNew ? (
                <button type="button" onClick={removeArticle} disabled={busy} className="mt-1 w-full border border-red-500/30 bg-red-900/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400 disabled:opacity-50">
                  Delete article
                </button>
              ) : null}
            </div>
          </section>

          <section className="border border-line-dark bg-surface p-5">
            <h2 className="font-display text-lg">Cover image</h2>
            <div className="mt-3 space-y-2">
              <MediaField value={meta.coverUrl} onChange={(url) => set({ coverUrl: url })} label="Cover image" />
              <input className="input" placeholder="Alt text" value={meta.coverAlt} onChange={(event) => set({ coverAlt: event.target.value })} />
              <input className="input" placeholder="Credit" value={meta.coverCredit} onChange={(event) => set({ coverCredit: event.target.value })} />
              {meta.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.coverUrl} alt="" className="mt-2 aspect-video w-full border border-line-dark object-cover" />
              ) : null}
            </div>
          </section>

          <section className="border border-line-dark bg-surface p-5">
            <h2 className="font-display text-lg">SEO</h2>
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="SEO title (max 70)" maxLength={70} value={meta.seoTitle} onChange={(event) => set({ seoTitle: event.target.value })} />
              <textarea className="input min-h-[64px]" placeholder="Meta description (max 160)" maxLength={160} value={meta.seoDescription} onChange={(event) => set({ seoDescription: event.target.value })} />
              <input className="input" placeholder="Canonical URL (optional)" value={meta.canonical} onChange={(event) => set({ canonical: event.target.value })} />
              <MediaField value={meta.socialImage} onChange={(url) => set({ socialImage: url })} label="Social image" />
              <label className="flex items-center gap-2 text-sm text-ivory/70">
                <input type="checkbox" checked={meta.noindex} onChange={(event) => set({ noindex: event.target.checked })} className="h-4 w-4 accent-[#C5A24B]" />
                Exclude from search engines (noindex)
              </label>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

