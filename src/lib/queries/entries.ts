import "server-only";
import { requireMember } from "@/lib/auth";
import type { Category, Mood } from "@/lib/constants";
import { PHOTO_COLUMNS, toPhotos, type Photo, type PhotoRow } from "@/lib/images";
import { commentCounts } from "@/lib/queries/comments";
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

// Lists (timeline, calendar) -------------------------------------------------------------

export type EntryFilters = {
  q?: string;
  visibility?: "private" | "public";
  category?: Category;
  mood?: Mood;
  author?: string;
  from?: string; // yyyy-mm-dd, inclusive
  to?: string; // yyyy-mm-dd, inclusive
  limit?: number;
};

export type EntryListItem = {
  id: string;
  title: string;
  entryDate: string;
  category: Category;
  mood: Mood | null;
  visibility: "private" | "public";
  authorId: string;
  authorName: string;
  cover: Photo | null;
  commentCount: number;
};

export type Author = { id: string; name: string };

/** Entries newest first, filtered, with cover photos. `hasMore` if past the limit. */
export async function listEntries(
  filters: EntryFilters = {},
): Promise<{ entries: EntryListItem[]; hasMore: boolean }> {
  await requireMember();
  const db = await createClient();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 1000);

  let query = db
    .from("entries")
    .select(
      "id, title, entry_date, category, mood, visibility, author_id, cover_photo_id, author:profiles!entries_author_id_fkey(display_name)",
    )
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (filters.visibility) query = query.eq("visibility", filters.visibility);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.mood) query = query.eq("mood", filters.mood);
  if (filters.author && UUID.test(filters.author)) query = query.eq("author_id", filters.author);
  if (filters.from) query = query.gte("entry_date", filters.from);
  if (filters.to) query = query.lte("entry_date", filters.to);
  if (filters.q?.trim()) {
    query = query.textSearch("search", filters.q.trim(), { type: "websearch", config: "english" });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Couldn't load entries: ${error.message}`);
  type Row = {
    id: string;
    title: string;
    entry_date: string;
    category: Category;
    mood: Mood | null;
    visibility: "private" | "public";
    author_id: string;
    cover_photo_id: string | null;
    author: { display_name: string } | { display_name: string }[] | null;
  };
  const rows = ((data ?? []) as Row[]).slice(0, limit);

  // Each entry's cover: its chosen cover, else its first photo.
  const covers = new Map<string, Photo>();
  if (rows.length) {
    const { data: photoRows, error: photoError } = await db
      .from("photos")
      .select(`${PHOTO_COLUMNS}, entry_id, sort_order`)
      .in(
        "entry_id",
        rows.map((r) => r.id),
      )
      .order("sort_order", { ascending: true });
    if (photoError) throw new Error(`Couldn't load cover photos: ${photoError.message}`);
    const all = (photoRows ?? []) as (PhotoRow & { entry_id: string })[];
    const chosen = rows.flatMap((r) => {
      const own = all.filter((p) => p.entry_id === r.id);
      const pick = own.find((p) => p.id === r.cover_photo_id) ?? own[0];
      return pick ? [pick] : [];
    });
    toPhotos(chosen).forEach((p, i) => covers.set(chosen[i].entry_id, p));
  }

  const counts = await commentCounts(rows.map((r) => r.id));

  return {
    hasMore: (data ?? []).length > limit,
    entries: rows.map((r) => {
      const author = Array.isArray(r.author) ? r.author[0] : r.author;
      return {
        id: r.id,
        title: r.title,
        entryDate: r.entry_date,
        category: r.category,
        mood: r.mood,
        visibility: r.visibility,
        authorId: r.author_id,
        authorName: author?.display_name ?? "",
        cover: covers.get(r.id) ?? null,
        commentCount: counts.get(r.id) ?? 0,
      };
    }),
  };
}

/** The two of us, for filters and avatars. */
export async function listAuthors(): Promise<Author[]> {
  await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, display_name")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Couldn't load profiles: ${error.message}`);
  return (data ?? []).map((p) => ({ id: p.id, name: p.display_name }));
}
