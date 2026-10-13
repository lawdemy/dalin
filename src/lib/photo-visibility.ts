import "server-only";
import { renameAsset } from "@/lib/cloudinary";
import type { createClient } from "@/lib/supabase/server";

/*
 * Signed Cloudinary URLs don't expire, so any change that can make a photo
 * stop being public must rename its file afterwards. Wrap such changes in
 * keepLinksPrivate(): it notes which photos were public, runs the change,
 * and renames every photo that is no longer public.
 */

type Db = Awaited<ReturnType<typeof createClient>>;

/** Which of these photos are public right now (members only). */
export async function publicPhotoIds(db: Db, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data, error } = await db.rpc("public_photo_ids", { ids });
  if (error) throw new Error(`Couldn't check photo visibility: ${error.message}`);
  return new Set(
    ((data ?? []) as (string | { public_photo_ids: string })[]).map((r) =>
      typeof r === "string" ? r : r.public_photo_ids,
    ),
  );
}

/** Gives each photo's file a new public_id. Returns false if any failed. */
export async function rekeyPhotos(db: Db, ids: string[]) {
  if (!ids.length) return true;
  const { data } = await db.from("photos").select("id, storage_path").in("id", ids);
  const outcomes = await Promise.all(
    (data ?? []).map(async (p) => {
      try {
        const next = await renameAsset(p.storage_path);
        const { error } = await db.from("photos").update({ storage_path: next }).eq("id", p.id);
        return !error;
      } catch (e) {
        console.error(`Re-keying photo ${p.id} failed`, e);
        return false;
      }
    }),
  );
  return outcomes.every(Boolean);
}

/**
 * Runs `change`, then re-keys photos among `ids` that went from public to
 * private. Pass every photo the change could affect. Returns false if a
 * rename failed (the change itself still happened).
 */
export async function keepLinksPrivate(db: Db, ids: string[], change: () => Promise<void>) {
  const before = await publicPhotoIds(db, ids);
  await change();
  if (!before.size) return true;
  const after = await publicPhotoIds(db, [...before]);
  return rekeyPhotos(
    db,
    [...before].filter((id) => !after.has(id)),
  );
}
