"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import {
  createUploadTicket,
  destroyAssets,
  photoIdFromPublicId,
  verifyUpload,
  type UploadTicket,
} from "@/lib/cloudinary";
import { PHOTO_COLUMNS, toPhotos, type Photo, type PhotoRow } from "@/lib/images";
import { publicPhotoIds, rekeyPhotos } from "@/lib/photo-visibility";
import { PUBLIC_TAG } from "@/lib/queries/public";
import { sanitizeDoc } from "@/lib/rich-text-doc";
import { slugFor, uniqueSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { entrySchema, registerPhotoSchema, type EntryInput } from "@/lib/validation";

type Db = Awaited<ReturnType<typeof createClient>>;

// Uploads -------------------------------------------------------------------------------

/** A one-time signed upload; the server chooses where the file goes. */
export async function getUploadTicket(): Promise<UploadTicket> {
  await requireMember();
  return createUploadTicket();
}

/**
 * Records an uploaded photo. Its size comes from Cloudinary, not the browser.
 * The row starts unattached (entry_id null, private) until the entry is saved.
 */
export async function registerPhoto(input: unknown): Promise<{ photo?: Photo; error?: string }> {
  await requireMember();
  const parsed = registerPhotoSchema.safeParse(input);
  if (!parsed.success) return { error: "That upload couldn't be recorded." };
  const { publicId, takenAt, blurDataUrl } = parsed.data;

  const db = await createClient();
  const asset = await verifyUpload(publicId);
  if (!asset) {
    // Clean up only a fresh upload, never a file an existing photo uses.
    const { count } = await db
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("storage_path", publicId);
    if (!count) await destroyAssets([publicId]);
    return { error: "That photo didn't upload correctly. Try again." };
  }

  const { data, error } = await db
    .from("photos")
    .insert({
      id: photoIdFromPublicId(publicId),
      storage_path: publicId,
      width: asset.width,
      height: asset.height,
      taken_at: takenAt,
      blur_data_url: blurDataUrl,
    })
    .select(PHOTO_COLUMNS)
    .single();
  if (error || !data) {
    // A duplicate means the file already belongs to a photo: keep it.
    if (error?.code !== "23505") await destroyAssets([publicId]);
    return { error: "That photo couldn't be saved. Try again." };
  }
  return { photo: toPhotos([data as PhotoRow])[0] };
}

/** Removes a photo that was uploaded but never saved into an entry. */
export async function discardPhoto(photoId: string) {
  await requireMember();
  if (!z.uuid().safeParse(photoId).success) return;
  const db = await createClient();
  const { data } = await db
    .from("photos")
    .delete()
    .eq("id", photoId)
    .is("entry_id", null)
    .select("storage_path");
  await destroyAssets((data ?? []).map((r) => r.storage_path));
}

// Entries -------------------------------------------------------------------------------

export type SaveEntryResult = {
  error?: string;
  fieldErrors?: Partial<Record<"title" | "entryDate" | "location" | "photos", string>>;
};

export async function saveEntry(input: EntryInput): Promise<SaveEntryResult> {
  await requireMember();
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      error: "Check the highlighted fields.",
      fieldErrors: {
        title: f.title?.[0],
        entryDate: f.entryDate?.[0],
        location: f.location?.[0],
        photos: f.photos?.[0],
      },
    };
  }
  const d = parsed.data;
  const db = await createClient();

  // The entry being edited, if any.
  let existing: {
    id: string;
    slug: string;
    title: string;
    entry_date: string;
    visibility: string;
  } | null = null;
  if (d.id) {
    const { data } = await db
      .from("entries")
      .select("id, slug, title, entry_date, visibility")
      .eq("id", d.id)
      .maybeSingle();
    if (!data) return { error: "This entry no longer exists." };
    existing = data;
  }

  // Photos must be new uploads or already belong to this entry.
  const photoIds = d.photos.map((p) => p.id);
  const { data: oldRows } = existing
    ? await db.from("photos").select("id, storage_path").eq("entry_id", existing.id)
    : { data: [] as { id: string; storage_path: string }[] };
  const old = oldRows ?? [];
  if (photoIds.length) {
    const { data: rows } = await db.from("photos").select("id, entry_id").in("id", photoIds);
    const ok =
      rows?.length === photoIds.length &&
      rows.every((r) => r.entry_id === null || r.entry_id === existing?.id);
    if (!ok) return { error: "Some photos couldn't be found. Remove them and try again." };
  }
  const removed = old.filter((p) => !photoIds.includes(p.id));
  const involved = [...new Set([...photoIds, ...old.map((p) => p.id)])];
  const publicBefore = await publicPhotoIds(db, involved);

  // Slugs are public URLs: set once, and only regenerated while the entry
  // has always been private (nobody can have the old link).
  const titleOrDateChanged =
    !existing || existing.title !== d.title || existing.entry_date !== d.entryDate;
  const regenerate =
    !existing ||
    (titleOrDateChanged && existing.visibility === "private" && d.visibility === "private");
  const slug = regenerate
    ? await freeSlug(db, slugFor(d.title, d.entryDate), existing?.id)
    : existing!.slug;

  const values = {
    slug,
    title: d.title,
    entry_date: d.entryDate,
    location: d.location,
    mood: d.mood,
    category: d.category,
    body: sanitizeDoc(d.body),
    visibility: d.visibility,
    cover_photo_id:
      d.coverPhotoId && photoIds.includes(d.coverPhotoId) ? d.coverPhotoId : (photoIds[0] ?? null),
  };

  let entryId = existing?.id;
  if (existing) {
    const { error } = await db.from("entries").update(values).eq("id", existing.id);
    if (error) return { error: "Couldn't save the entry. Try again." };
  } else {
    const { data, error } = await db.from("entries").insert(values).select("id").single();
    if (error || !data) return { error: "Couldn't save the entry. Try again." };
    entryId = data.id;
  }

  // Attach photos in order with captions; caption doubles as alt text.
  const results = await Promise.all(
    d.photos.map((p, i) =>
      db
        .from("photos")
        .update({ entry_id: entryId, sort_order: i, caption: p.caption, alt_text: p.caption })
        .eq("id", p.id),
    ),
  );
  if (results.some((r) => r.error)) {
    return { error: "The entry was saved, but some photos weren't. Try saving again." };
  }

  if (removed.length) {
    await db
      .from("photos")
      .delete()
      .in(
        "id",
        removed.map((p) => p.id),
      );
    await destroyAssets(removed.map((p) => p.storage_path));
  }

  // Signed links don't expire: rename files that just stopped being public.
  const remaining = involved.filter((id) => !removed.some((r) => r.id === id));
  const publicAfter = await publicPhotoIds(db, remaining);
  const unpublished = remaining.filter((id) => publicBefore.has(id) && !publicAfter.has(id));
  if (unpublished.length && !(await rekeyPhotos(db, unpublished))) {
    return { error: "Saved, but old photo links couldn't be switched off. Save again to retry." };
  }

  updateTag(PUBLIC_TAG);
  redirect(`/admin/entries/${entryId}`);
}

export async function deleteEntry(id: string) {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return;
  const db = await createClient();
  const { data: photos } = await db.from("photos").select("storage_path").eq("entry_id", id);
  const { error } = await db.from("entries").delete().eq("id", id);
  if (error) throw new Error("Couldn't delete the entry. Try again.");
  // Photo rows go with the entry (on delete cascade); remove their files too.
  await destroyAssets((photos ?? []).map((p) => p.storage_path));
  updateTag(PUBLIC_TAG);
  redirect("/admin");
}

// Helpers -------------------------------------------------------------------------------

async function freeSlug(db: Db, base: string, exceptId?: string) {
  let query = db.from("entries").select("slug").like("slug", `${base}%`);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query;
  return uniqueSlug(
    base,
    (data ?? []).map((r) => r.slug),
  );
}
