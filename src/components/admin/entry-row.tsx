import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { CloudImage } from "@/components/ui/cloud-image";
import { placeholderTone } from "@/components/ui/photo-tile";
import { VisibilityBadge } from "@/components/ui/visibility-badge";
import { categoryLabel } from "@/lib/format";
import type { EntryListItem } from "@/lib/queries/entries";
import { cn } from "@/lib/utils";

type EntryRowProps = {
  entry: EntryListItem;
  /** e.g. "Mon 12" in the timeline, a full date elsewhere. */
  dateLabel: string;
  /** Second partner gets the alternate avatar tone. */
  altTone?: boolean;
  index?: number;
  className?: string;
};

/** Timeline / calendar row: thumbnail, title, author and meta, visibility icon. */
export function EntryRow({ entry, dateLabel, altTone, index = 0, className }: EntryRowProps) {
  return (
    <Link
      href={`/admin/entries/${entry.id}`}
      className={cn("flex items-center gap-3 py-3 text-ink no-underline hover:text-ink", className)}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        {entry.cover ? (
          <CloudImage
            sources={entry.cover.sources}
            blurDataUrl={entry.cover.blurDataUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div aria-hidden className={cn("size-full", placeholderTone(index))} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="leading-snug font-medium">{entry.title}</span>
        <span className="flex items-center gap-1.5 text-caption text-muted">
          {entry.authorName && (
            <Avatar name={entry.authorName} size="xs" tone={altTone ? "b" : "a"} />
          )}
          {dateLabel} · {categoryLabel(entry.category)}
          {entry.commentCount > 0 && (
            <span
              className="ml-1 flex items-center gap-0.5"
              aria-label={`${entry.commentCount} comments`}
            >
              <MessageCircle aria-hidden className="size-3.5" strokeWidth={1.8} />
              {entry.commentCount}
            </span>
          )}
        </span>
      </div>
      <VisibilityBadge visibility={entry.visibility} compact />
    </Link>
  );
}
