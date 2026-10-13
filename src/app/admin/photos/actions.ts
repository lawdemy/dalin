"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { destroyAssets } from "@/lib/cloudinary";
import { keepLinksPrivate } from "@/lib/photo-visibility";
import { PUBLIC_TAG } from "@/lib/queries/public";
import { createClient } from "@/lib/supabase/server";

/*
 * Photo library actions. Every change that can make a photo stop being
 * public goes through keepLinksPrivate, which renames the file afterwards so
 * old signed links stop working.
 */

export type PhotoActionResult = { error?: string };

const RENAME_FAILED = "Saved, but old links to this photo couldn't be switched off. Try again.";

const settingsSchema = z.object({
  id: z.uuid(),
  inGallery: z.boolean(),
  onAbout: z.boolean(),
  caption: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
});

/** Gallery / About switches and the caption (also used as alt text). */
export async function updatePhoto(
  input: z.input<typeof settingsSchema>,
): Promise<PhotoActionResult> {
  await requireMember();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: "That change couldn't be saved." };
  const { id, inGallery, onAbout, caption } = parsed.data;
  const db = await createClient();

  const { data: current } = await db
    .from("photos")
    .select("show_on_about")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { error: "That photo no longer exists." };

  // New About photos go to the end of the About grid.
  let aboutOrder: number | null | undefined;
  if (onAbout && !current.show_on_about) {
    const { data: last } = await db
      .from("photos")
      .select("about_sort_order")
      .eq("show_on_about", true)
      .order("about_sort_order", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    aboutOrder = (last?.about_sort_order ?? 0) + 1;
  } else if (!onAbout) {
    aboutOrder = null;
  }

  let failed = false;
  const ok = await keepLinksPrivate(db, [id], async () => {
    const { error } = await db
      .from("photos")
      .update({
        is_public: inGallery,
        show_on_about: onAbout,
        caption,
        alt_text: caption,
        ...(aboutOrder !== undefined ? { about_sort_order: aboutOrder } : {}),
      })
      .eq("id", id);
    failed = Boolean(error);
  });
  if (failed) return { error: "That change couldn't be saved. Try again." };

  updateTag(PUBLIC_TAG);
  return ok ? {} : { error: RENAME_FAILED };
}

/** Makes a photo the home page hero, or clears it with null. */
export async function setHeroPhoto(id: string | null): Promise<PhotoActionResult> {
  await requireMember();
  if (id !== null && !z.uuid().safeParse(id).success)
    return { error: "That photo couldn't be found." };
  const db = await createClient();

  const { data: settings } = await db
    .from("site_settings")
    .select("hero_photo_id")
    .eq("id", 1)
    .maybeSingle();
  const previous = settings?.hero_photo_id ?? null;

  let failed = false;
  // The old hero may stop being public; the new one becomes public.
  const ok = await keepLinksPrivate(db, previous ? [previous] : [], async () => {
    const { error } = await db.from("site_settings").update({ hero_photo_id: id }).eq("id", 1);
    failed = Boolean(error);
  });
  if (failed) return { error: "The hero photo couldn't be changed. Try again." };

  updateTag(PUBLIC_TAG);
  return ok ? {} : { error: RENAME_FAILED };
}

/** Deletes a photo row and its file. Entries using it as a cover fall back to no cover. */
export async function deletePhoto(id: string): Promise<PhotoActionResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That photo couldn't be found." };
  const db = await createClient();

  const { data, error } = await db.from("photos").delete().eq("id", id).select("storage_path");
  if (error) return { error: "The photo couldn't be deleted. Try again." };
  await destroyAssets((data ?? []).map((r) => r.storage_path));

  updateTag(PUBLIC_TAG);
  return {};
}
