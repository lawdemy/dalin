import "server-only";
import { signedSources, type ImageSource } from "@/lib/cloudinary";

export type PhotoRow = {
  id: string;
  storage_path: string;
  width: number;
  height: number;
  caption: string | null;
  alt_text: string | null;
  blur_data_url: string | null;
};

/** What pages receive: signed sources, never the raw storage path. */
export type Photo = {
  id: string;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
  blurDataUrl: string | null;
  sources: ImageSource[];
};

export const PHOTO_COLUMNS = "id, storage_path, width, height, caption, alt_text, blur_data_url";

/**
 * Signs Cloudinary URLs for photo rows. Callers pass only rows they read
 * through Supabase (RLS applied), so a visitor's query never yields a private
 * photo to sign. Signing is local; there is no network call.
 */
export function toPhotos(rows: PhotoRow[]): Photo[] {
  return rows.map((r) => ({
    id: r.id,
    width: r.width,
    height: r.height,
    alt: r.alt_text || r.caption || "",
    caption: r.caption,
    blurDataUrl: r.blur_data_url,
    sources: signedSources(r.storage_path, r.width),
  }));
}
