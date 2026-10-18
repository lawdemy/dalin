import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { PHOTO_COLUMNS, toPhotos, type Photo, type PhotoRow } from "@/lib/images";
import { SITE_NAME, type Category, type Mood } from "@/lib/constants";
import { BOOK_COLUMNS, toBook, type Book, type BookRow } from "@/lib/queries/books";
import { createPublicClient } from "@/lib/supabase/public";
import type { TiptapDoc } from "@/components/rich-text/rich-text";

/*
 * Read helpers for the public site.
 *
 * Privacy: everything here uses the anonymous client, so RLS decides what is
 * visible (public entries only while Moments is on, photos that pass
 * photo_is_public). The explicit visibility filters below are a second layer.
 *
 * Caching: results are cached under the "public" tag (admin writes call
 * updateTag("public")), regenerated every 15 minutes and never served older
 * than 50 minutes. Photo URLs are signed Cloudinary URLs for rows read here.
 */

export const PUBLIC_TAG = "public";
export const MOMENTS_PER_PAGE = 10;
export const GALLERY_PAGE_SIZE = 24;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type SiteSettings = {
  coupleNames: string;
  welcomeLine: string;
  heroPhotoId: string | null;
  ourStory: TiptapDoc | null;
  howWeMet: TiptapDoc | null;
  engagementDate: string | null;
  engagementPlace: string | null;
  engagementStory: TiptapDoc | null;
  momentsEnabled: boolean;
};

export type MomentSummary = {
  id: string;
  slug: string;
  title: string;
  entryDate: string;
  location: string | null;
  mood: Mood | null;
  category: Category;
  excerpt: string;
  cover: Photo | null;
};

export type Moment = MomentSummary & {
  body: TiptapDoc | null;
  photos: Photo[];
  newer: { slug: string; title: string } | null;
  older: { slug: string; title: string } | null;
};

type EntryRow = {
  id: string;
  slug: string;
  title: string;
  entry_date: string;
  location: string | null;
  mood: Mood | null;
  category: Category;
  body_text: string;
  cover_photo_id: string | null;
  created_at: string;
  body?: TiptapDoc;
};

const ENTRY_COLUMNS =
  "id, slug, title, entry_date, location, mood, category, body_text, cover_photo_id, created_at";

const DEFAULT_SETTINGS: SiteSettings = {
  coupleNames: SITE_NAME,
  welcomeLine: "",
  heroPhotoId: null,
  ourStory: null,
  howWeMet: null,
  engagementDate: null,
  engagementPlace: null,
  engagementStory: null,
  momentsEnabled: false,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  if (!db) return DEFAULT_SETTINGS;

  const { data, error } = await db
    .from("site_settings")
    .select(
      "couple_names, welcome_line, hero_photo_id, our_story, how_we_met, engagement_date, engagement_place, engagement_story, moments_enabled",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load site settings: ${error.message}`);
  if (!data) return DEFAULT_SETTINGS;

  return {
    coupleNames: data.couple_names || SITE_NAME,
    welcomeLine: data.welcome_line ?? "",
    heroPhotoId: data.hero_photo_id,
    ourStory: data.our_story,
    howWeMet: data.how_we_met,
    engagementDate: data.engagement_date,
    engagementPlace: data.engagement_place,
    engagementStory: data.engagement_story,
    momentsEnabled: data.moments_enabled === true,
  };
}

export async function getHeroPhoto(): Promise<Photo | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  const { heroPhotoId } = await getSiteSettings();
  if (!db || !heroPhotoId) return null;

  const { data, error } = await db.from("photos").select(PHOTO_COLUMNS).eq("id", heroPhotoId);
  if (error) throw new Error(`Couldn't load the hero photo: ${error.message}`);
  const [photo] = toPhotos((data ?? []) as PhotoRow[]);
  return photo ?? null;
}

/**
 * A photo for the "wedding coming soon" banner. The anonymous query only
 * returns public photos (RLS), so a private photo can never be picked.
 * Preference: landscape, then About photos, then gallery, then photos from
 * public moments; never the hero, so the home page doesn't repeat itself.
 */
export async function getWeddingBannerPhoto(): Promise<Photo | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  if (!db) return null;
  const { heroPhotoId } = await getSiteSettings();

  const { data, error } = await db
    .from("photos")
    .select(`${PHOTO_COLUMNS}, show_on_about, is_public, created_at`)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Couldn't load a banner photo: ${error.message}`);

  type Row = PhotoRow & { show_on_about: boolean; is_public: boolean };
  const score = (r: Row) =>
    (r.width > r.height ? 4 : 0) + (r.show_on_about ? 2 : 0) + (r.is_public ? 1 : 0);
  const candidates = ((data ?? []) as Row[]).filter((r) => r.id !== heroPhotoId);
  const best = candidates.sort((a, b) => score(b) - score(a))[0];
  return best ? toPhotos([best])[0] : null;
}

export async function getAboutPhotos(): Promise<Photo[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  if (!db) return [];

  const { data, error } = await db
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("show_on_about", true)
    .order("about_sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(24);
  if (error) throw new Error(`Couldn't load About photos: ${error.message}`);
  return toPhotos((data ?? []) as PhotoRow[]);
}

/** Gallery photos, newest first. Fetches one extra row to know if there are more. */
export async function getGalleryPhotos(
  offset = 0,
  limit = GALLERY_PAGE_SIZE,
): Promise<{ photos: Photo[]; hasMore: boolean }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  if (!db) return { photos: [], hasMore: false };

  const { data, error } = await db
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit);
  if (error) throw new Error(`Couldn't load gallery photos: ${error.message}`);

  const rows = (data ?? []) as PhotoRow[];
  return { photos: toPhotos(rows.slice(0, limit)), hasMore: rows.length > limit };
}

/** One page of public moments, newest first. Empty while Moments is off. */
export async function getMoments(
  page = 1,
  perPage = MOMENTS_PER_PAGE,
): Promise<{ moments: MomentSummary[]; total: number; pageCount: number }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  const { momentsEnabled } = await getSiteSettings();
  if (!db || !momentsEnabled) return { moments: [], total: 0, pageCount: 0 };

  const from = (Math.max(1, page) - 1) * perPage;
  const { data, error, count } = await db
    .from("entries")
    .select(ENTRY_COLUMNS, { count: "exact" })
    .eq("visibility", "public")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);
  if (error) throw new Error(`Couldn't load moments: ${error.message}`);

  const total = count ?? 0;
  const moments = await withCovers(db, (data ?? []) as EntryRow[]);
  return { moments, total, pageCount: Math.ceil(total / perPage) };
}

/**
 * A single public moment, or null when it doesn't exist, is private, or
 * Moments is off. All three look the same to a visitor.
 */
/** Books marked public, newest first. Empty until migration 0009 runs. */
export async function getPublicBooks(): Promise<Book[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("books")
    .select(BOOK_COLUMNS)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw new Error(`Couldn't load books: ${error.message}`);
  }
  return ((data ?? []) as BookRow[]).map(toBook);
}

export async function getMoment(slug: string): Promise<Moment | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3000 });
  cacheTag(PUBLIC_TAG);

  const db = createPublicClient();
  if (!db || !SLUG_PATTERN.test(slug)) return null;
  const { momentsEnabled } = await getSiteSettings();
  if (!momentsEnabled) return null;

  const { data, error } = await db
    .from("entries")
    .select(`${ENTRY_COLUMNS}, body`)
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the moment: ${error.message}`);
  if (!data) return null;
  const entry = data as EntryRow;

  const [photosResult, newer, older] = await Promise.all([
    db
      .from("photos")
      .select(PHOTO_COLUMNS)
      .eq("entry_id", entry.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    adjacent(db, entry, "newer"),
    adjacent(db, entry, "older"),
  ]);
  if (photosResult.error) {
    throw new Error(`Couldn't load the moment's photos: ${photosResult.error.message}`);
  }
  const photos = toPhotos((photosResult.data ?? []) as PhotoRow[]);
  const cover = photos.find((p) => p.id === entry.cover_photo_id) ?? photos[0] ?? null;

  return {
    ...toSummary(entry, cover),
    body: entry.body ?? null,
    photos,
    newer,
    older,
  };
}

// Helpers ------------------------------------------------------------------------------

type Db = NonNullable<ReturnType<typeof createPublicClient>>;

function toSummary(entry: EntryRow, cover: Photo | null): MomentSummary {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    entryDate: entry.entry_date,
    location: entry.location,
    mood: entry.mood,
    category: entry.category,
    excerpt: excerpt(entry.body_text),
    cover,
  };
}

/** Adds each entry's cover photo (its chosen cover, else its first photo). */
async function withCovers(db: Db, entries: EntryRow[]): Promise<MomentSummary[]> {
  if (entries.length === 0) return [];
  const { data, error } = await db
    .from("photos")
    .select(`${PHOTO_COLUMNS}, entry_id, sort_order`)
    .in(
      "entry_id",
      entries.map((e) => e.id),
    )
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Couldn't load cover photos: ${error.message}`);

  const rows = (data ?? []) as (PhotoRow & { entry_id: string })[];
  const chosen = entries.flatMap((e) => {
    const own = rows.filter((r) => r.entry_id === e.id);
    const pick = own.find((r) => r.id === e.cover_photo_id) ?? own[0];
    return pick ? [pick] : [];
  });
  const signed = new Map(toPhotos(chosen).map((p) => [p.id, p]));

  return entries.map((e) => {
    const pick = chosen.find((r) => r.entry_id === e.id);
    return toSummary(e, pick ? (signed.get(pick.id) ?? null) : null);
  });
}

async function adjacent(db: Db, entry: EntryRow, direction: "newer" | "older") {
  const op = direction === "newer" ? "gt" : "lt";
  const { data, error } = await db
    .from("entries")
    .select("slug, title")
    .eq("visibility", "public")
    .or(
      `entry_date.${op}.${entry.entry_date},and(entry_date.eq.${entry.entry_date},created_at.${op}."${entry.created_at}")`,
    )
    .order("entry_date", { ascending: direction === "newer" })
    .order("created_at", { ascending: direction === "newer" })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the ${direction} moment: ${error.message}`);
  return (data as { slug: string; title: string } | null) ?? null;
}

function excerpt(text: string, max = 160) {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
}
