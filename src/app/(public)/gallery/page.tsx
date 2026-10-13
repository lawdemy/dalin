import { Image as ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { getGalleryPhotos, getSiteSettings } from "@/lib/queries/public";
import { GalleryFeed } from "./gallery-feed";
import { shareMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { coupleNames } = await getSiteSettings();
  const description = `Little pieces of ${coupleNames}: photos from our life together.`;
  return {
    title: "Gallery",
    description,
    ...shareMetadata({ title: `Gallery · ${coupleNames}`, description }),
  };
}

export default async function GalleryPage() {
  const { photos, hasMore } = await getGalleryPhotos();

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col px-4 pb-12 md:px-6 md:pb-20">
      <header className="flex flex-col items-center gap-2 pt-10 pb-6 text-center md:pt-12 md:pb-8">
        <Eyebrow>Gallery</Eyebrow>
        <h1 className="text-title md:text-title-lg">Little pieces of us</h1>
      </header>
      {photos.length ? (
        <GalleryFeed initialPhotos={photos} initialHasMore={hasMore} />
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No photos yet"
          description="Our favourite photos will appear here."
        />
      )}
    </div>
  );
}
