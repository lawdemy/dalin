import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Server-side renderer for Tiptap JSON. Builds React elements directly from a
 * fixed allowlist of nodes and marks, so no user HTML is ever injected.
 * Anything not on the list is dropped (its text content is kept).
 */

export type TiptapMark = { type: string; attrs?: Record<string, unknown> };
export type TiptapNode = {
  type: string;
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
};
export type TiptapDoc = TiptapNode;

/** True when a document has no visible text. */
export function isEmptyDoc(doc: TiptapDoc | null | undefined): boolean {
  if (!doc || typeof doc !== "object") return true;
  if (typeof doc.text === "string" && doc.text.trim()) return false;
  return !(doc.content ?? []).some((child) => !isEmptyDoc(child));
}

type RichTextProps = { doc: TiptapDoc | null | undefined; className?: string };

export function RichText({ doc, className }: RichTextProps) {
  if (isEmptyDoc(doc)) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      {renderChildren(doc!)}
    </div>
  );
}

function renderChildren(node: TiptapNode): ReactNode[] {
  return (node.content ?? []).map((child, i) => renderNode(child, i));
}

function renderNode(node: TiptapNode, key: number): ReactNode {
  if (!node || typeof node !== "object") return null;
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "paragraph":
      return <p key={key}>{renderChildren(node)}</p>;
    case "heading":
      // Page titles are h1; body headings start at h2.
      return node.attrs?.level === 3 ? (
        <h3 key={key} className="mt-2 text-card">
          {renderChildren(node)}
        </h3>
      ) : (
        <h2 key={key} className="mt-2 text-section">
          {renderChildren(node)}
        </h2>
      );
    case "bulletList":
      return <ul key={key}>{renderChildren(node)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderChildren(node)}</ol>;
    case "listItem":
      return <li key={key}>{renderChildren(node)}</li>;
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-2 rounded-xl bg-linen px-5 py-4 font-serif text-quote font-medium italic"
        >
          {renderChildren(node)}
        </blockquote>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} className="my-2 border-sand" />;
    default:
      // Unknown node: keep its text, drop the wrapper.
      return <span key={key}>{renderChildren(node)}</span>;
  }
}

function renderText(node: TiptapNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) {
        out = (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow">
            {out}
          </a>
        );
      }
    }
  }
  return <span key={key}>{out}</span>;
}

/** Only http(s) and mailto links; anything else (javascript:, data:) is dropped. */
function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
