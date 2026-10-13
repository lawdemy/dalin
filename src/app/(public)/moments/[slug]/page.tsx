import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhotoGrid } from "@/components/public/photo-grid";
import { RichText } from "@/components/rich-text/rich-text";
import { Tag } from "@/components/ui/chip";
import { CloudImage } from "@/components/ui/cloud-image";
import { categoryLabel, formatEntryDate, moodInfo } from "@/lib/format";
import { getMoment, getSiteSettings } from "@/lib/queries/public";
import { shareMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/moments/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [moment, { coupleNames }] = await Promise.all([getMoment(slug), getSiteSettings()]);
  // Private, missing and switched-off moments all get the same generic title.
  if (!moment) return { title: "Not found" };
  return {
    title: moment.title,
    description: moment.excerpt || undefined,
    ...shareMetadata({
      type: "article",
      title: `${moment.title} · ${coupleNames}`,
      description: moment.excerpt || undefined,
    }),
  };
}

export default function MomentPage({ params }: PageProps<"/moments/[slug]">) {
  return (
    <Suspense fallback={<MomentSkeleton />}>
      {params.then(({ slug }) => (
        <MomentContent slug={slug} />
      ))}
    </Suspense>
  );
}

async function MomentContent({ slug }: { slug: string }) {
  const moment = await getMoment(slug);
  if (!moment) notFound();

  const mood = moodInfo(moment.mood);
  // The cover sits at the top; the grid shows every photo, cover included.
  return (
    <div className="flex flex-col pb-16 md:pb-24">
      <div className="mx-auto w-full max-w-180 px-2 pt-2 md:px-4">
        <Link
          href="/moments"
          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
          All moments
        </Link>
      </div>

      <article className="flex flex-col">
        <header className="mx-auto flex w-full max-w-180 flex-col gap-3 px-5 pt-4 pb-6 md:px-6">
          <Tag>{categoryLabel(moment.category)}</Tag>
          <h1 className="text-title md:text-title-lg">{moment.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar aria-hidden className="size-3.5" strokeWidth={1.8} />
              <time dateTime={moment.entryDate}>{formatEntryDate(moment.entryDate)}</time>
            </span>
            {moment.location && (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden className="size-3.5" strokeWidth={1.8} />
                {moment.location}
              </span>
            )}
            {mood && (
              <span className="flex items-center gap-1.5">
                <span aria-hidden>{mood.emoji}</span>
                {mood.label}
              </span>
            )}
          </div>
        </header>

        {moment.cover && (
          <div className="mx-auto w-full max-w-180 md:px-6">
            <div className="relative h-75 overflow-hidden bg-tone-2 md:h-105 md:rounded-xl">
              <CloudImage
                sources={moment.cover.sources}
                blurDataUrl={moment.cover.blurDataUrl}
                alt={moment.cover.alt}
                fill
                priority
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-180 px-5 pt-8 md:px-6">
          <RichText doc={moment.body} />
        </div>

        {moment.photos.length > 1 && (
          <section
            aria-labelledby="moment-photos"
            className="mx-auto flex w-full max-w-180 flex-col gap-3 px-5 pt-10 md:px-6"
          >
            <h2 id="moment-photos" className="text-section">
              Photos
            </h2>
            <PhotoGrid photos={moment.photos} layout="entry" max={5} />
          </section>
        )}
      </article>

      {(moment.newer || moment.older) && (
        <nav
          aria-label="More moments"
          className="mx-auto mt-12 grid w-full max-w-180 grid-cols-2 gap-2 px-5 md:px-6"
        >
          <AdjacentLink moment={moment.newer} label="Newer" />
          <AdjacentLink moment={moment.older} label="Older" alignRight />
        </nav>
      )}
    </div>
  );
}

function AdjacentLink({
  moment,
  label,
  alignRight,
}: {
  moment: { slug: string; title: string } | null;
  label: string;
  alignRight?: boolean;
}) {
  if (!moment) return <span />;
  return (
    <Link
      href={`/moments/${moment.slug}`}
      className={`flex flex-col gap-0.5 rounded-xl border border-sand p-4 text-ink no-underline hover:bg-linen hover:text-ink ${alignRight ? "text-right" : ""}`}
    >
      <span className="text-caption text-muted">{label}</span>
      <span className="font-serif text-xl leading-tight font-semibold">{moment.title}</span>
    </Link>
  );
}

function MomentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="mx-auto flex w-full max-w-180 flex-col gap-4 px-5 pt-14 md:px-6"
    >
      <div className="h-7 w-24 animate-pulse rounded-full bg-linen" />
      <div className="h-12 w-3/4 animate-pulse rounded-xl bg-linen" />
      <div className="h-75 animate-pulse rounded-xl bg-linen" />
    </div>
  );
}
