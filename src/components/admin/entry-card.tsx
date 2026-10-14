import { ImageOff } from "lucide-react";
import Link from "next/link";
import { ViewablePhoto } from "@/components/public/photo-grid";
import { placeholderTone } from "@/components/ui/photo-tile";
import { VisibilityBadge } from "@/components/ui/visibility-badge";
import { entryMeta, moodInfo } from "@/lib/format";
import type { EntryListItem } from "@/lib/queries/entries";
import { cn } from "@/lib/utils";

type EntryCardProps = {
  entry: EntryListItem;
  index?: number;
  /** Small note above the title, e.g. "1 year ago". */
  note?: string;
};

/**
 * Dashboard card for any entry, private or public. The photo opens the
 * zoomable viewer; the text opens the entry.
 */
export function AdminEntryCard({ entry, index = 0, note }: EntryCardProps) {
  const mood = moodInfo(entry.mood);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-linen">
      <div className="relative">
        {entry.cover ? (
          <ViewablePhoto
            photos={[entry.cover]}
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
            className="h-52"
          />
        ) : (
          <Link
            href={`/admin/entries/${entry.id}`}
            aria-hidden
            tabIndex={-1}
            className={cn("flex h-52 items-center justify-center", placeholderTone(index + 1))}
          >
            <ImageOff className="size-6 text-tone-ink/60" strokeWidth={1.5} />
          </Link>
        )}
        <VisibilityBadge
          visibility={entry.visibility}
          className="pointer-events-none absolute top-2.5 left-2.5 shadow-segment"
        />
      </div>
      <Link
        href={`/admin/entries/${entry.id}`}
        className="flex flex-1 flex-col gap-1 p-4 text-ink no-underline hover:bg-sand/40 hover:text-ink"
      >
        {note && <span className="text-caption font-medium text-accent-dark">{note}</span>}
        <span className="text-caption text-muted">
          {entryMeta(entry.entryDate, entry.category)}
          {mood && ` · ${mood.emoji}`}
        </span>
        <span className="font-serif text-card leading-tight font-semibold">{entry.title}</span>
        {entry.authorName && <span className="text-caption text-muted">by {entry.authorName}</span>}
      </Link>
    </article>
  );
}
