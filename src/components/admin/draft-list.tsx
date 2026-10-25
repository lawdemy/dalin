"use client";

import {
  BookOpen,
  FilePen,
  Heart,
  MessageCircle,
  NotebookPen,
  Reply,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { discardDraft } from "@/app/admin/drafts/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TIME_ZONE } from "@/lib/constants";
import type { DraftSummary } from "@/lib/queries/drafts";
import type { DraftKind } from "@/lib/validation";

const KINDS: Record<DraftKind, { label: string; icon: LucideIcon }> = {
  entry: { label: "Entry", icon: BookOpen },
  note: { label: "Personal note", icon: Heart },
  comment: { label: "Comment", icon: MessageCircle },
  note_reply: { label: "Reply to a note", icon: Reply },
  book_note: { label: "Reading note", icon: NotebookPen },
};

const day = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const time = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const date = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});
const dateWithYear = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Gmail's style: the time for today, the date this year, the full date before. */
function when(iso: string, now: Date) {
  const d = new Date(iso);
  if (day.format(d) === day.format(now)) return time.format(d);
  if (day.format(d).slice(0, 4) === day.format(now).slice(0, 4)) return date.format(d);
  return dateWithYear.format(d);
}

function context(draft: DraftSummary) {
  if (!draft.context) return null;
  const short =
    draft.context.length > 60 ? `${draft.context.slice(0, 60).trimEnd()}…` : draft.context;
  switch (draft.kind) {
    case "comment":
      return `On “${short}”`;
    case "book_note":
      return `On “${short}”`;
    case "note_reply":
      return `To the note “${short}”`;
    default:
      return null;
  }
}

export function DraftList({ drafts, now: nowIso }: { drafts: DraftSummary[]; now: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  // From the server, so server and client print the same times.
  const now = new Date(nowIso);

  if (drafts.length === 0) {
    return (
      <EmptyState
        icon={FilePen}
        title="No drafts"
        description="Start an entry, note or comment and it saves here until you send it."
      />
    );
  }

  return (
    <>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-danger-text">
          {error}
        </p>
      )}
      <ul className="flex flex-col divide-y divide-divider border-y border-divider">
        {drafts.map((d) => {
          const { label, icon: Icon } = KINDS[d.kind];
          const where = context(d);
          return (
            <li key={d.id} className="flex items-center gap-2">
              <Link
                href={d.href}
                className="flex min-w-0 flex-1 items-start gap-3 py-3 text-ink no-underline hover:text-ink"
              >
                <Icon
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-accent"
                  strokeWidth={1.6}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-caption font-semibold tracking-[0.5px] text-danger-text uppercase">
                      Draft · {label}
                    </span>
                    <time dateTime={d.updatedAt} className="shrink-0 text-caption text-muted">
                      {when(d.updatedAt, now)}
                    </time>
                  </span>
                  {where && <span className="truncate text-caption text-muted">{where}</span>}
                  <span className="line-clamp-2 break-words">{d.preview || "(Empty)"}</span>
                </span>
              </Link>
              <ConfirmDialog
                title="Discard this draft?"
                description={
                  d.kind === "entry"
                    ? "What you wrote and any photos you added to it will be deleted."
                    : "What you wrote will be deleted."
                }
                confirmLabel="Discard"
                cancelLabel="Keep it"
                onConfirm={async () => {
                  const res = await discardDraft(d.id);
                  setError(res.error);
                  router.refresh();
                }}
                trigger={(open) => (
                  <button
                    type="button"
                    onClick={open}
                    aria-label={`Discard draft: ${d.preview || label}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-linen hover:text-danger-text"
                  >
                    <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
                  </button>
                )}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
