"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import {
  createUploadTicket,
  destroyAssets,
  isValidPublicId,
  verifyUpload,
  type UploadTicket,
} from "@/lib/cloudinary";
import { keepLinksPrivate } from "@/lib/photo-visibility";
import { PUBLIC_TAG } from "@/lib/queries/public";
import { createClient } from "@/lib/supabase/server";

export type SettingsResult = { error?: string };

/**
 * Shows or hides the public Moments feed. Turning it off hides public
 * entries and the photos that were public only through them, so those
 * photos' files are renamed (old signed links stop working).
 */
export async function setMomentsEnabled(enabled: boolean): Promise<SettingsResult> {
  await requireMember();
  if (typeof enabled !== "boolean") return { error: "That change couldn't be saved." };
  const db = await createClient();

  let affected: string[] = [];
  if (!enabled) {
    const { data: entries } = await db.from("entries").select("id").eq("visibility", "public");
    const entryIds = (entries ?? []).map((e) => e.id);
    if (entryIds.length) {
      const { data: photos } = await db.from("photos").select("id").in("entry_id", entryIds);
      affected = (photos ?? []).map((p) => p.id);
    }
  }

  let failed = false;
  const ok = await keepLinksPrivate(db, affected, async () => {
    const { error } = await db
      .from("site_settings")
      .update({ moments_enabled: enabled })
      .eq("id", 1);
    failed = Boolean(error);
  });
  if (failed) return { error: "That change couldn't be saved. Try again." };

  updateTag(PUBLIC_TAG);
  return ok
    ? {}
    : { error: "Saved, but some old photo links couldn't be switched off. Try again." };
}

const nameSchema = z
  .string()
  .trim()
  .min(1, "Add your name.")
  .max(40, "Keep it under 40 characters.");

/** Your own display name (RLS only lets each of us edit our own profile). */
export async function updateDisplayName(name: string): Promise<SettingsResult> {
  const me = await requireMember();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = await createClient();
  const { error } = await db.from("profiles").update({ display_name: parsed.data }).eq("id", me.id);
  return error ? { error: "Couldn't save your name. Try again." } : {};
}

/** One-time signed upload for a profile photo (private, members only). */
export async function getAvatarUploadTicket(): Promise<UploadTicket> {
  await requireMember();
  return createUploadTicket("avatar");
}

/** Sets (or with null, removes) your profile photo and deletes the old file. */
export async function setAvatar(publicId: string | null): Promise<SettingsResult> {
  const me = await requireMember();
  const db = await createClient();
  if (publicId !== null && !(await verifyUpload(publicId, "avatar"))) {
    // Clean up only a fresh avatar file that no profile uses.
    if (typeof publicId === "string" && isValidPublicId(publicId, "avatar")) {
      const { count } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("avatar_path", publicId);
      if (!count) await destroyAssets([publicId]);
    }
    return { error: "That photo didn't upload correctly. Try again." };
  }
  const { data: current } = await db
    .from("profiles")
    .select("avatar_path")
    .eq("id", me.id)
    .maybeSingle();
  const { error } = await db.from("profiles").update({ avatar_path: publicId }).eq("id", me.id);
  if (error) return { error: "Couldn't save your photo. Try again." };
  if (current?.avatar_path && current.avatar_path !== publicId)
    await destroyAssets([current.avatar_path]);
  return {};
}
