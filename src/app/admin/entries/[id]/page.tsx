import { ArrowLeft, Calendar, ExternalLink, MapPin, Pencil, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/public/photo-grid";
import { RichText } from "@/components/rich-text/rich-text";
import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/chip";
import { CloudImage } from "@/components/ui/cloud-image";
import { EmptyState } from "@/components/ui/empty-state";
import { VisibilityBadge } from "@/components/ui/visibility-badge";
import { categoryLabel, formatEntryDate, moodInfo } from "@/lib/format";
import { getEntry } from "@/lib/queries/entries";
import { isEmptyDoc } from "@/components/rich-text/rich-text";

export const metadata: Metadata = { title: "Entry" };

/** Read view of one entry, private or public. */
export default async function EntryPage({ params }: PageProps<"/admin/entries/[id]">) {
  const { id } = await params;
  const entry = await getEntry(id); // checks membership
  if (!entry) notFound();

  const mood = moodInfo(entry.mood);
  const cover = entry.photos.find((p) => p.id === entry.coverPhotoId) ?? entry.photos[0];

  return (
    <article className="mx-auto flex w-full max-w-180 flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin"
          className="-ml-3 inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
          Diary
        </Link>
        <Link
          href={`/admin/entries/${entry.id}/edit`}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          <Pencil aria-hidden className="size-4" strokeWidth={1.8} />
          Edit
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{categoryLabel(entry.category)}</Tag>
          <VisibilityBadge visibility={entry.visibility} />
        </div>
        <h1 className="text-title md:text-title-lg">{entry.title}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar aria-hidden className="size-3.5" strokeWidth={1.8} />
            <time dateTime={entry.entryDate}>{formatEntryDate(entry.entryDate)}</time>
          </span>
          {entry.location && (
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden className="size-3.5" strokeWidth={1.8} />
              {entry.location}
            </span>
          )}
          {mood && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden>{mood.emoji}</span>
              {mood.label}
            </span>
          )}
          {entry.authorName && (
            <span className="flex items-center gap-1.5">
              <UserRound aria-hidden className="size-3.5" strokeWidth={1.8} />
              {entry.authorName}
            </span>
          )}
        </div>
        {entry.visibility === "public" && (
          <Link
            href={`/moments/${entry.slug}`}
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-label font-medium"
          >
            <ExternalLink aria-hidden className="size-4" strokeWidth={1.8} />
            View on the public site
          </Link>
        )}
      </header>

      {cover && (
        <div className="relative -mx-5 h-75 overflow-hidden bg-tone-2 md:mx-0 md:h-105 md:rounded-xl">
          <CloudImage
            sources={cover.sources}
            blurDataUrl={cover.blurDataUrl}
            alt={cover.alt}
            fill
            priority
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {isEmptyDoc(entry.body) ? (
        <EmptyState
          title="Nothing written yet"
          description="Add the story of the day when you're ready."
        />
      ) : (
        <RichText doc={entry.body} />
      )}

      {entry.photos.length > 1 && (
        <section aria-labelledby="entry-photos" className="flex flex-col gap-3 pt-2">
          <h2 id="entry-photos" className="text-section">
            Photos
          </h2>
          <PhotoGrid photos={entry.photos} layout="entry" />
        </section>
      )}
    </article>
  );
}
