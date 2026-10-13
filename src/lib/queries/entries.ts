import "server-only";
import { requireMember } from "@/lib/auth";
import type { Category, Mood } from "@/lib/constants";
import { PHOTO_COLUMNS, toPhotos, type Photo, type PhotoRow } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import type { TiptapDoc } from "@/components/rich-text/rich-text";

/*
 * Read helpers for the private side. Every function checks membership first
 * and queries with the signed-in user's session, so RLS gives members
 * everything and anyone else nothing.
 */

export type Entry = {
  id: string;
  slug: string;
  title: string;
  entryDate: string;
  location: string | null;
  mood: Mood | null;
  category: Category;
  body: TiptapDoc | null;
  visibility: "private" | "public";
  coverPhotoId: string | null;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** One entry with its photos in order, or null if it doesn't exist. */
export async function getEntry(id: string): Promise<Entry | null> {
  await requireMember();
  if (!UUID.test(id)) return null;
  const db = await createClient();

  const { data, error } = await db
    .from("entries")
    .select(
      "id, slug, title, entry_date, location, mood, category, body, visibility, cover_photo_id, created_at, updated_at, author:profiles!entries_author_id_fkey(display_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the entry: ${error.message}`);
  if (!data) return null;

  const { data: photoRows, error: photoError } = await db
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("entry_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (photoError) throw new Error(`Couldn't load the entry's photos: ${photoError.message}`);

  const author = Array.isArray(data.author) ? data.author[0] : data.author;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    entryDate: data.entry_date,
    location: data.location,
    mood: data.mood,
    category: data.category,
    body: data.body,
    visibility: data.visibility,
    coverPhotoId: data.cover_photo_id,
    authorName: author?.display_name ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    photos: toPhotos((photoRows ?? []) as PhotoRow[]),
  };
}
