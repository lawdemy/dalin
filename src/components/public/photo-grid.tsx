"use client";

import { useState } from "react";
import { CloudImage } from "@/components/ui/cloud-image";
import { Lightbox } from "@/components/ui/lightbox";
import type { Photo } from "@/lib/images";
import { cn } from "@/lib/utils";

type PhotoGridProps = {
  photos: Photo[];
  /**
   * masonry: two/three columns of natural heights (gallery).
   * square: three-column square tiles (home strip, About).
   * entry: first photo full width, the rest in pairs (a moment's photos).
   */
  layout?: "masonry" | "square" | "entry";
  /** Show at most this many tiles; the last one opens with "+N more". */
  max?: number;
  /** Total when `photos` is one page of a longer list (lightbox counter). */
  total?: number;
  className?: string;
};

/** Photo tiles that open a full-screen lightbox. */
export function PhotoGrid({ photos, layout = "square", max, total, className }: PhotoGridProps) {
  const [index, setIndex] = useState<number | null>(null);
  const shown = max ? photos.slice(0, max) : photos;
  const hidden = photos.length - shown.length;

  const items = photos.map((p) => ({
    key: p.id,
    caption: p.caption ?? undefined,
    content: (
      <CloudImage sources={p.sources} alt={p.alt} fill sizes="100vw" className="object-contain" />
    ),
  }));

  return (
    <>
      <div
        className={cn(
          layout === "masonry" && "columns-2 gap-2 md:columns-3 md:gap-3",
          layout === "square" && "grid grid-cols-3 gap-2 md:gap-3",
          layout === "entry" && "grid grid-cols-2 gap-2",
          className,
        )}
      >
        {shown.map((photo, i) => {
          const isLast = i === shown.length - 1 && hidden > 0;
          const label = photo.alt ? `Open photo: ${photo.alt}` : `Open photo ${i + 1}`;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={isLast ? `${label}, and ${hidden} more` : label}
              className={cn(
                "relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-tone-3",
                layout === "masonry" && "mb-2 break-inside-avoid md:mb-3",
                layout === "square" && "aspect-square",
                layout === "entry" && (i === 0 ? "col-span-2 h-55" : "h-40"),
              )}
              style={
                layout === "masonry"
                  ? { aspectRatio: `${photo.width} / ${photo.height}` }
                  : undefined
              }
            >
              <CloudImage
                sources={photo.sources}
                alt=""
                fill
                sizes={
                  layout === "masonry"
                    ? "(min-width: 768px) 33vw, 50vw"
                    : layout === "entry" && i === 0
                      ? "(min-width: 768px) 720px, 100vw"
                      : "(min-width: 768px) 360px, 50vw"
                }
                blurDataUrl={photo.blurDataUrl}
                className="object-cover"
              />
              {isLast && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink-soft/80 text-[0.9375rem] font-medium text-ivory">
                  +{hidden} more
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Lightbox items={items} index={index} onIndexChange={setIndex} total={total} />
    </>
  );
}
