"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { destroyAssets } from "@/lib/cloudinary";
import { todayInDiary } from "@/lib/format";
import { publicPhotoIds } from "@/lib/photo-visibility";
import { pushSoon } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import { visionSchema, type VisionInput } from "@/lib/validation";

type Db = Awaited<ReturnType<typeof createClient>>;

export type VisionResult = { error?: string; fieldErrors?: Record<string, string>; id?: string };

const NOT_YOURS = "Only the person this vision belongs to can change it.";

/** Removes a vision's old picture, unless it is public or belongs to an entry. */
async function removeVisionPhoto(db: Db, photoId: string) {
  try {
    if ((await publicPhotoIds(db, [photoId])).has(photoId)) return;
    const { data } = await db
      .from("photos")
      .delete()
      .eq("id", photoId)
      .is("entry_id", null)
      .select("storage_path");
    await destroyAssets((data ?? []).map((r) => r.storage_path));
  } catch (e) {
    // The vision is already saved; a leftover photo stays visible under Photos.
    console.error(`Removing vision photo ${photoId} failed`, e);
  }
}

/** Adds a vision, or with an id updates it. RLS limits changes to family visions and your own. */
export async function saveVision(input: VisionInput): Promise<VisionResult> {
  const me = await requireMember();
  pushSoon();
  const parsed = visionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors };
  }
  const { id, ...v } = parsed.data;
  const row = {
    title: v.title,
    area: v.area,
    owner_id: v.forWhom === "family" ? null : me.id,
    description: v.description,
    target_date: v.targetDate,
    status: v.status,
    achieved_on: v.status === "achieved" ? (v.achievedOn ?? todayInDiary()) : null,
    photo_id: v.photoId,
  };

  const db = await createClient();
  let oldPhotoId: string | null = null;
  if (id) {
    const { data: current } = await db
      .from("visions")
      .select("photo_id")
      .eq("id", id)
      .maybeSingle();
    oldPhotoId = current?.photo_id ?? null;
  }
  const { data, error } = id
    ? await db.from("visions").update(row).eq("id", id).select("id")
    : await db.from("visions").insert(row).select("id");
  if (error?.code === "42P01" || error?.code === "PGRST205")
    return { error: "The vision board switches on once migration 0013 has been run in Supabase." };
  if (error) return { error: "Couldn't save the vision. Try again." };
  if (!data?.length) return { error: NOT_YOURS };

  if (oldPhotoId && oldPhotoId !== v.photoId) await removeVisionPhoto(db, oldPhotoId);
  return { id: data[0].id };
}

/** Deletes a vision and its picture (a picture that is public stays in Photos). */
export async function deleteVision(id: string) {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return;
  const db = await createClient();
  const { data, error } = await db.from("visions").delete().eq("id", id).select("photo_id");
  if (error) throw new Error("Couldn't delete the vision. Try again.");
  if (!data?.length) throw new Error(NOT_YOURS);
  if (data[0].photo_id) await removeVisionPhoto(db, data[0].photo_id);
  redirect("/admin/vision");
}
