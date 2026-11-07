import { Fragment } from "react";

/**
 * Minimal, allowlisted inline renderer. Input is treated strictly as text and
 * converted to React nodes — raw HTML is never evaluated.
 *
 * Supported: **bold**, *italic*, [label](https://example.com), `code`.
 */

const LINK_RE = /^\[([^\]]{1,200})\]\(([^)\s]{1,2048})\)$/;

function safeHref(raw) {
  const value = String(raw || "").trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

function inline(text) {
  const source = String(text || "");
  const nodes = [];
  let index = 0;
  let key = 0;
  let buffer = "";

  const flush = () => {
    if (!buffer) return;
    nodes.push(<Fragment key={`t-${key++}`}>{buffer}</Fragment>);
    buffer = "";
  };

  while (index < source.length) {
    const char = source[index];

    if (char === "*" && source[index + 1] === "*") {
      const end = source.indexOf("**", index + 2);
      if (end > index + 2) {
        flush();
        nodes.push(<strong key={`b-${key++}`}>{inline(source.slice(index + 2, end))}</strong>);
        index = end + 2;
        continue;
      }
    }

    if (char === "*") {
      const end = source.indexOf("*", index + 1);
      if (end > index + 1) {
        flush();
        nodes.push(<em key={`i-${key++}`}>{inline(source.slice(index + 1, end))}</em>);
        index = end + 1;
        continue;
      }
    }

    if (char === "`") {
      const end = source.indexOf("`", index + 1);
      if (end > index + 1) {
        flush();
        nodes.push(
          <code key={`c-${key++}`} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">
            {source.slice(index + 1, end)}
          </code>,
        );
        index = end + 1;
        continue;
      }
    }

    if (char === "[") {
      const match = source.slice(index).match(LINK_RE);
      if (match) {
        const href = safeHref(match[2]);
        flush();
        nodes.push(
          href ? (
            <a key={`a-${key++}`} href={href} rel={href.startsWith("/") ? undefined : "noopener noreferrer"}>
              {match[1]}
            </a>
          ) : (
            <Fragment key={`a-${key++}`}>{match[1]}</Fragment>
          ),
        );
        index += match[0].length;
        continue;
      }
    }

    buffer += char;
    index += 1;
  }

  flush();
  return nodes;
}

export default function RichText({ text = "", as: Tag = "p", className = "" }) {
  const value = String(text || "");
  const paragraphs = value.split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <Tag key={index} className={className}>
          {inline(paragraph).map((node, nodeIndex) => (
            <Fragment key={nodeIndex}>{node}</Fragment>
          ))}
        </Tag>
      ))}
    </>
  );
}

export { inline as renderInline };
