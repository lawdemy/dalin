import type { TiptapDoc, TiptapMark, TiptapNode } from "@/components/rich-text/rich-text";

/*
 * Cleans editor JSON before it is stored: keeps only the nodes, marks and
 * attributes the renderer supports, with limits on depth and size. Anything
 * else is unwrapped (its text kept) or dropped.
 */

const BLOCKS = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
]);
const MAX_DEPTH = 12;
const MAX_TEXT = 20_000;

export const EMPTY_DOC: TiptapDoc = { type: "doc", content: [] };

export function sanitizeDoc(input: unknown): TiptapDoc {
  if (!isObject(input) || input.type !== "doc") return EMPTY_DOC;
  let budget = MAX_TEXT;

  function clean(node: unknown, depth: number): TiptapNode[] {
    if (!isObject(node) || typeof node.type !== "string" || depth > MAX_DEPTH) return [];

    if (node.type === "text") {
      if (typeof node.text !== "string" || !node.text || budget <= 0) return [];
      const text = node.text.slice(0, budget);
      budget -= text.length;
      const marks = cleanMarks(node.marks);
      return [marks.length ? { type: "text", text, marks } : { type: "text", text }];
    }

    const children = Array.isArray(node.content)
      ? node.content.flatMap((c) => clean(c, depth + 1))
      : [];
    if (!BLOCKS.has(node.type)) return children; // unwrap unknown nodes

    const out: TiptapNode = { type: node.type };
    switch (node.type) {
      case "hardBreak":
      case "horizontalRule":
        return [out];
      case "heading":
        out.attrs = { level: isObject(node.attrs) && node.attrs.level === 3 ? 3 : 2 };
        out.content = asInline(children);
        return [out];
      case "paragraph":
        out.content = asInline(children);
        return [out];
      case "bulletList":
      case "orderedList":
        out.content = children.map((c) =>
          c.type === "listItem" ? c : { type: "listItem", content: asBlocks([c]) },
        );
        return out.content.length ? [out] : [];
      default: // blockquote, listItem
        out.content = asBlocks(children);
        return [out];
    }
  }

  const content = Array.isArray(input.content) ? input.content.flatMap((c) => clean(c, 1)) : [];
  return { type: "doc", content: asBlocks(content) };
}

const INLINE = new Set(["text", "hardBreak"]);

/** Wraps runs of loose inline nodes in paragraphs so containers hold blocks. */
function asBlocks(nodes: TiptapNode[]): TiptapNode[] {
  const out: TiptapNode[] = [];
  let run: TiptapNode[] = [];
  const flush = () => {
    if (run.length) out.push({ type: "paragraph", content: run });
    run = [];
  };
  for (const n of nodes) {
    if (INLINE.has(n.type)) run.push(n);
    else {
      flush();
      out.push(n);
    }
  }
  flush();
  return out;
}

/** Flattens any blocks inside a paragraph or heading down to their text. */
function asInline(nodes: TiptapNode[]): TiptapNode[] {
  return nodes.flatMap((n) => (INLINE.has(n.type) ? [n] : asInline(n.content ?? [])));
}

function cleanMarks(marks: unknown): TiptapMark[] {
  if (!Array.isArray(marks)) return [];
  return marks.flatMap((m): TiptapMark[] => {
    if (!isObject(m)) return [];
    if (m.type === "bold" || m.type === "italic") return [{ type: m.type }];
    if (m.type === "link" && isObject(m.attrs) && typeof m.attrs.href === "string") {
      const href = safeHref(m.attrs.href);
      return href ? [{ type: "link", attrs: { href } }] : [];
    }
    return [];
  });
}

export function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function isObject(
  v: unknown,
): v is Record<string, unknown> & { content?: unknown; attrs?: unknown } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
