"use server";

import { z } from "zod";
import { GALLERY_PAGE_SIZE, getGalleryPhotos } from "@/lib/queries/public";

const offsetSchema = z.number().int().min(0).max(10_000);

/**
 * Next page of gallery photos for infinite scroll. Public by design: it uses
 * the same anonymous query as the page, so it can only return public photos.
 */
export async function loadMoreGalleryPhotos(offset: number) {
  const parsed = offsetSchema.safeParse(offset);
  if (!parsed.success) return { photos: [], hasMore: false };
  return getGalleryPhotos(parsed.data, GALLERY_PAGE_SIZE);
}
