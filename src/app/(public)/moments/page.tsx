import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MomentCard } from "@/components/public/moment-card";
import { Eyebrow } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { getMoments, getSiteSettings } from "@/lib/queries/public";
import { cn } from "@/lib/utils";
import { shareMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { coupleNames } = await getSiteSettings();
  const description = `Moments from ${coupleNames}'s life together.`;
  return {
    title: "Moments",
    description,
    ...shareMetadata({ title: `Moments · ${coupleNames}`, description }),
  };
}

export default async function MomentsPage({ searchParams }: PageProps<"/moments">) {
  const { momentsEnabled } = await getSiteSettings();
  if (!momentsEnabled) notFound();

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col px-5 pb-16 md:px-6 md:pb-24">
      <header className="flex flex-col items-center gap-2 pt-10 pb-8 text-center md:pt-12">
        <Eyebrow>Moments</Eyebrow>
        <h1 className="text-title md:text-title-lg">Days we want to remember</h1>
      </header>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Feed({ searchParams }: { searchParams: PageProps<"/moments">["searchParams"] }) {
  const raw = (await searchParams).page;
  const page = parsePage(Array.isArray(raw) ? raw[0] : raw);
  if (page === null) notFound();

  const { moments, pageCount } = await getMoments(page);
  if (page > 1 && page > pageCount) notFound();

  if (moments.length === 0) {
    return <EmptyState title="No moments yet" description="Our first shared page is on its way." />;
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {moments.map((m, i) => (
          <MomentCard key={m.id} moment={m} index={i} />
        ))}
      </div>
      {pageCount > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-4">
          <PageLink page={page - 1} disabled={page <= 1} direction="newer" />
          <span className="text-caption text-muted">
            Page {page} of {pageCount}
          </span>
          <PageLink page={page + 1} disabled={page >= pageCount} direction="older" />
        </nav>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  direction,
}: {
  page: number;
  disabled: boolean;
  direction: "newer" | "older";
}) {
  const label = direction === "newer" ? "Newer" : "Older";
  const content = (
    <>
      {direction === "newer" && <ChevronLeft aria-hidden className="size-4.5" strokeWidth={1.8} />}
      {label}
      {direction === "older" && <ChevronRight aria-hidden className="size-4.5" strokeWidth={1.8} />}
    </>
  );
  const classes = "flex min-h-11 items-center gap-1 rounded-xl px-3 font-medium no-underline";
  if (disabled) {
    return (
      <span aria-hidden className={cn(classes, "invisible")}>
        {content}
      </span>
    );
  }
  return (
    <Link
      href={page === 1 ? "/moments" : `/moments?page=${page}`}
      rel={direction === "newer" ? "prev" : "next"}
      className={cn(classes, "hover:bg-linen")}
    >
      {content}
    </Link>
  );
}

/** "2" → 2; missing → 1; anything else → null (404). */
function parsePage(value: string | undefined) {
  if (value === undefined) return 1;
  if (!/^[1-9]\d{0,3}$/.test(value)) return null;
  return Number(value);
}

function FeedSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading moments"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-72 animate-pulse rounded-xl bg-linen" />
      ))}
    </div>
  );
}
