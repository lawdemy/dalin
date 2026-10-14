import "server-only";
import { requireMember } from "@/lib/auth";
import { PHOTO_COLUMNS, toPhotos, type Photo, type PhotoRow } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";

export type LibraryPhoto = Photo & {
  inGallery: boolean;
  onAbout: boolean;
  isHero: boolean;
  /** Position in the About grid (lower first), when onAbout. */
  aboutSortOrder: number | null;
  createdAt: string;
  entry: { id: string; title: string; visibility: "private" | "public" } | null;
};

export type PhotoLibrary = { photos: LibraryPhoto[]; momentsEnabled: boolean };

/** Up to this many photos, newest first (paging can come later). */
const LIMIT = 1000;

/** Every photo with its public switches and the entry it belongs to. Members only. */
export async function getPhotoLibrary(): Promise<PhotoLibrary> {
  await requireMember();
  const db = await createClient();

  const [photos, settings] = await Promise.all([
    db
      .from("photos")
      .select(
        `${PHOTO_COLUMNS}, is_public, show_on_about, about_sort_order, created_at, entry:entries!photos_entry_id_fkey(id, title, visibility)`,
      )
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    db.from("site_settings").select("hero_photo_id, moments_enabled").eq("id", 1).maybeSingle(),
  ]);
  if (photos.error) throw new Error(`Couldn't load photos: ${photos.error.message}`);
  if (settings.error) throw new Error(`Couldn't load settings: ${settings.error.message}`);

  const heroId = settings.data?.hero_photo_id ?? null;
  type Row = PhotoRow & {
    is_public: boolean;
    show_on_about: boolean;
    about_sort_order: number | null;
    created_at: string;
    entry: LibraryPhoto["entry"] | LibraryPhoto["entry"][];
  };
  const rows = (photos.data ?? []) as Row[];
  const signed = toPhotos(rows);

  return {
    momentsEnabled: settings.data?.moments_enabled === true,
    photos: rows.map((r, i) => ({
      ...signed[i],
      inGallery: r.is_public,
      onAbout: r.show_on_about,
      isHero: r.id === heroId,
      aboutSortOrder: r.about_sort_order,
      createdAt: r.created_at,
      entry: (Array.isArray(r.entry) ? r.entry[0] : r.entry) ?? null,
    })),
  };
}
