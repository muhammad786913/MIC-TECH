import Icon from "@/components/ui/Icon";
import SmartImage from "./SmartImage";
import RichText from "./RichText";

function Caption({ children }) {
  if (!children) return null;
  return (
    <figcaption className="mt-2.5 border-l-2 border-gold pl-3 text-xs leading-relaxed text-ivory/55">
      {children}
    </figcaption>
  );
}

function Gallery({ block }) {
  const images = block.images || [];
  return (
    <figure className="my-8">
      {block.title ? (
        <h3 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
          {block.title}
        </h3>
      ) : null}
      <div className={images.length === 1 ? "grid gap-2" : "grid grid-cols-2 gap-2 md:grid-cols-3"}>
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className={`relative overflow-hidden bg-surface-2 ${
              images.length === 1 ? "aspect-[16/9]" : "aspect-square"
            }`}
          >
            <SmartImage
              src={image.url}
              alt={image.alt || `Gallery image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 30vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <Caption>
        {images
          .map((image) => [image.caption, image.credit].filter(Boolean).join(" — "))
          .filter(Boolean)
          .join(" · ")}
      </Caption>
    </figure>
  );
}

function Video({ block }) {
  const url = String(block.url || "");
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,20})/);
  const vimeo = url.match(/vimeo\.com\/(\d{5,12})/);
  if (youtube) {
    return (
      <figure className="my-8">
        <div className="relative aspect-video overflow-hidden bg-ink">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtube[1]}`}
            title={block.title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <Caption>{block.caption}</Caption>
      </figure>
    );
  }
  if (vimeo) {
    return (
      <figure className="my-8">
        <div className="relative aspect-video overflow-hidden bg-ink">
          <iframe
            src={`https://player.vimeo.com/video/${vimeo[1]}`}
            title={block.title || "Video"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <Caption>{block.caption}</Caption>
      </figure>
    );
  }
  return (
    <figure className="my-8">
      <video
        controls
        preload="metadata"
        poster={block.poster || undefined}
        className="w-full bg-ink"
        aria-label={block.title || "Video"}
      >
        <source src={url} />
        Your browser does not support embedded video.
      </video>
      <Caption>{block.caption}</Caption>
    </figure>
  );
}

function Embed({ block }) {
  const url = String(block.url || "");
  let src = "";
  if (block.provider === "youtube" && /youtube|youtu\.be/.test(url)) {
    const id = url.match(/(?:watch\?v=|youtu\.be\/|embed\/)([\w-]{6,20})/);
    if (id) src = `https://www.youtube-nocookie.com/embed/${id[1]}`;
  } else if (block.provider === "vimeo" && /vimeo\.com/.test(url)) {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d{5,12})/);
    if (id) src = `https://player.vimeo.com/video/${id[1]}`;
  }
  if (!src) return null;
  return (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden bg-ink">
        <iframe
          src={src}
          title={block.title || `${block.provider} embed`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {block.title ? <Caption>{block.title}</Caption> : null}
    </figure>
  );
}

function FileCard({ block, kind }) {
  const label = kind === "pdf" ? "PDF" : "Document";
  return (
    <div className="my-8 border border-line-dark bg-surface p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold/40 bg-surface-2 text-gold">
          <Icon name="file-text" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="kicker">{label}</p>
          <p className="mt-1 font-display text-lg leading-snug">{block.title}</p>
          {block.description ? (
            <p className="mt-1 font-body text-sm text-ivory/70">{block.description}</p>
          ) : null}
          <a
            href={block.url}
            download
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-gold hover:text-ivory"
          >
            <Icon name="download" size={14} /> Download{block.size ? ` · ${block.size}` : ""}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ArticleBody({ blocks = [] }) {
  return (
    <div className="article-prose">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "text":
            return (
              <RichText
                key={block.id}
                text={block.text}
                className={index === 0 ? "dropcap" : undefined}
              />
            );
          case "richText":
            return <RichText key={block.id} text={block.text} className={index === 0 ? "dropcap" : undefined} />;
          case "image":
            return (
              <figure key={block.id} className="my-8">
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                  <SmartImage
                    src={block.url}
                    alt={block.alt || ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
                <Caption>
                  {[block.caption, block.credit].filter(Boolean).join(" — ")}
                </Caption>
              </figure>
            );
          case "gallery":
            return <Gallery key={block.id} block={block} />;
          case "video":
            return <Video key={block.id} block={block} />;
          case "embed":
            return <Embed key={block.id} block={block} />;
          case "pdf":
          case "document":
            return <FileCard key={block.id} block={block} kind={block.type} />;
          case "quote":
            return (
              <blockquote key={block.id} className="my-9 border-y border-line-dark py-6">
                <p className="font-display text-[clamp(1.35rem,2.4vw,1.9rem)] font-medium leading-snug text-ivory">
                  <span className="mr-1 text-gold" aria-hidden="true">
                    “
                  </span>
                  {block.text}
                </p>
                {block.attribution ? (
                  <footer className="mt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory/55">
                    {block.attribution}
                  </footer>
                ) : null}
              </blockquote>
            );
          case "highlight":
            return (
              <aside
                key={block.id}
                className="my-8 border-l-4 border-gold bg-surface-2/70 px-5 py-4 sm:px-6"
              >
                {block.title ? <p className="kicker">{block.title}</p> : null}
                <p className="mt-1.5 font-body text-[1.02em] leading-relaxed text-ivory">{block.text}</p>
              </aside>
            );
          case "link":
            return (
              <a
                key={block.id}
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="my-6 flex items-start justify-between gap-4 border border-line-dark bg-surface p-4 no-underline transition-colors hover:border-gold"
              >
                <span className="min-w-0">
                  <span className="block font-display text-base font-semibold text-ivory">{block.label}</span>
                  {block.description ? (
                    <span className="mt-1 block font-sans text-sm text-ivory/70">{block.description}</span>
                  ) : null}
                  <span className="mt-1.5 block truncate font-sans text-xs text-ivory/55">{block.url}</span>
                </span>
                <Icon name="arrow-up-right" size={18} className="mt-1 shrink-0 text-gold" />
              </a>
            );
          case "divider":
            return (
              <div key={block.id} className="my-9 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-line-dark" />
                <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                <span className="h-px flex-1 bg-line-dark" />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
