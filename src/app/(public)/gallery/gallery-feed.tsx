"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PhotoGrid } from "@/components/public/photo-grid";
import { Button } from "@/components/ui/button";
import type { Photo } from "@/lib/images";
import { loadMoreGalleryPhotos } from "./actions";

type GalleryFeedProps = { initialPhotos: Photo[]; initialHasMore: boolean };

/** Masonry gallery that loads the next page as you near the bottom. */
export function GalleryFeed({ initialPhotos, initialHasMore }: GalleryFeedProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);

  function loadMore() {
    if (pending || !hasMore) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const next = await loadMoreGalleryPhotos(photos.length);
        setPhotos((current) => {
          const seen = new Set(current.map((p) => p.id));
          return [...current, ...next.photos.filter((p) => !seen.has(p.id))];
        });
        setHasMore(next.hasMore);
      } catch {
        setFailed(true);
      }
    });
  }

  // Load automatically when the bottom comes into view; the button is the fallback.
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMoreRef.current();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, failed]);

  return (
    <div className="flex flex-col gap-6">
      <PhotoGrid photos={photos} layout="masonry" />
      <div ref={sentinel} className="flex flex-col items-center gap-2 py-4" aria-live="polite">
        {failed && (
          <p className="text-caption text-danger-text">Couldn&rsquo;t load more photos.</p>
        )}
        {hasMore ? (
          <Button variant="secondary" onClick={loadMore} pending={pending}>
            {pending ? "Loading more photos…" : failed ? "Try again" : "Load more photos"}
          </Button>
        ) : (
          photos.length > 0 && (
            <p className="text-caption text-muted">That&rsquo;s every photo, for now.</p>
          )
        )}
      </div>
    </div>
  );
}
