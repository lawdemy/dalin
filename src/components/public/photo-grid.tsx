"use client";

import { ZoomIn } from "lucide-react";
import { useState } from "react";
import { CloudImage } from "@/components/ui/cloud-image";
import { Lightbox, type LightboxItem } from "@/components/ui/lightbox";
import type { Photo } from "@/lib/images";
import { cn } from "@/lib/utils";

/** Lightbox entries that load a sharper size as you zoom in. */
export function lightboxItems(photos: Photo[]): LightboxItem[] {
  return photos.map((p) => ({
    key: p.id,
    caption: p.caption ?? undefined,
    content: (zoom: number) => (
      <CloudImage
        sources={p.sources}
        alt={p.alt}
        fill
        sizes={`${Math.ceil(zoom) * 100}vw`}
        className="object-contain"
      />
    ),
  }));
}

/** Hover zoom + magnifier shared by every photo that opens the viewer. */
const HOVER_IMAGE = "transition-transform duration-300 ease-out group-hover:scale-105";

function HoverMagnifier() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-ink/55 text-ivory opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      <ZoomIn className="size-4.5" strokeWidth={2} />
    </span>
  );
}

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

/** Photo tiles that open a full-screen lightbox with zoom. */
export function PhotoGrid({ photos, layout = "square", max, total, className }: PhotoGridProps) {
  const [index, setIndex] = useState<number | null>(null);
  const shown = max ? photos.slice(0, max) : photos;
  const hidden = photos.length - shown.length;

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
          const label = photo.alt ? `View photo: ${photo.alt}` : `View photo ${i + 1}`;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={isLast ? `${label}, and ${hidden} more` : label}
              className={cn(
                "group relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-tone-3",
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
                className={cn("object-cover", HOVER_IMAGE)}
              />
              {isLast ? (
                <span className="absolute inset-0 flex items-center justify-center bg-ink-soft/80 text-[0.9375rem] font-medium text-ivory">
                  +{hidden} more
                </span>
              ) : (
                <HoverMagnifier />
              )}
            </button>
          );
        })}
      </div>
      <Lightbox
        items={lightboxItems(photos)}
        index={index}
        onIndexChange={setIndex}
        total={total}
      />
    </>
  );
}

type ViewablePhotoProps = {
  /** All photos the viewer can step through. */
  photos: Photo[];
  /** Which one this tile shows. */
  index?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** A single photo (e.g. an entry's cover) that opens the zoomable viewer. */
export function ViewablePhoto({
  photos,
  index = 0,
  sizes,
  priority,
  className,
}: ViewablePhotoProps) {
  const [open, setOpen] = useState<number | null>(null);
  const photo = photos[index];
  if (!photo) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(index)}
        aria-label={photo.alt ? `View photo: ${photo.alt}` : "View photo"}
        className={cn("group relative block w-full cursor-zoom-in overflow-hidden", className)}
      >
        <CloudImage
          sources={photo.sources}
          blurDataUrl={photo.blurDataUrl}
          alt={photo.alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn("object-cover", HOVER_IMAGE)}
        />
        <HoverMagnifier />
      </button>
      <Lightbox items={lightboxItems(photos)} index={open} onIndexChange={setOpen} />
    </>
  );
}
