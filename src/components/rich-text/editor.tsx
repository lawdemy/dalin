"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Link2, List, Quote, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TiptapDoc } from "./rich-text";

type EditorProps = {
  id: string;
  /** Starting document (only read on mount). */
  initialContent: TiptapDoc | null;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
  /** id of the visible label, for screen readers. */
  labelledBy?: string;
};

/**
 * Tiptap editor limited to what RichText renders: paragraphs, h2/h3, bold,
 * italic, lists, quotes and links. Everything else is switched off.
 */
export function Editor({
  id,
  initialContent,
  onChange,
  placeholder = "Write about your day…",
  labelledBy,
}: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent && initialContent.content?.length ? initialContent : "",
    editorProps: {
      attributes: {
        id,
        class: "rich-editor min-h-44 px-4 py-3.5 text-body leading-relaxed outline-none",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as TiptapDoc),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            heading: e.isActive("heading", { level: 2 }),
            list: e.isActive("bulletList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
          }
        : null,
  });

  function toggleLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Link address (https://…)");
    if (!url) return;
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  const buttons: { label: string; icon: LucideIcon; on?: boolean; run: () => void }[] = [
    {
      label: "Bold",
      icon: Bold,
      on: active?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      on: active?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading",
      icon: Heading2,
      on: active?.heading,
      run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      on: active?.list,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Quote",
      icon: Quote,
      on: active?.quote,
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    { label: "Link", icon: Link2, on: active?.link, run: toggleLink },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-linen focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex gap-0.5 overflow-x-auto border-b border-sand bg-track px-1 py-0.5"
      >
        {buttons.map(({ label, icon: Icon, on, run }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={Boolean(on)}
            onMouseDown={(e) => e.preventDefault()} // keep the selection
            onClick={run}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg",
              on ? "bg-ivory text-accent-dark shadow-segment" : "text-ink-soft hover:bg-ivory/60",
            )}
          >
            <Icon aria-hidden className="size-4.5" strokeWidth={1.8} />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
