import Link from "next/link";
import { EntryCard } from "@/components/ui/card";
import { CloudImage } from "@/components/ui/cloud-image";
import { placeholderTone } from "@/components/ui/photo-tile";
import { entryMeta } from "@/lib/format";
import type { MomentSummary } from "@/lib/queries/public";
import { cn } from "@/lib/utils";

type MomentCardProps = {
  moment: MomentSummary;
  layout?: "featured" | "row";
  /** Placeholder tone when there is no cover photo. */
  index?: number;
  className?: string;
};

export function MomentCard({ moment, layout = "featured", index = 0, className }: MomentCardProps) {
  const media = moment.cover ? (
    <div className="relative h-full w-full">
      <CloudImage
        sources={moment.cover.sources}
        blurDataUrl={moment.cover.blurDataUrl}
        alt={moment.cover.alt}
        fill
        sizes={layout === "row" ? "96px" : "(min-width: 768px) 400px, 100vw"}
        className="object-cover"
      />
    </div>
  ) : (
    <div aria-hidden className={cn("h-full w-full", placeholderTone(index + 1))} />
  );

  return (
    <Link
      href={`/moments/${moment.slug}`}
      className={cn("block rounded-xl text-ink no-underline hover:text-ink", className)}
    >
      <EntryCard
        layout={layout}
        media={media}
        meta={entryMeta(moment.entryDate, moment.category)}
        title={moment.title}
        className={layout === "featured" ? "h-full transition-colors hover:bg-sand/60" : undefined}
      />
    </Link>
  );
}
