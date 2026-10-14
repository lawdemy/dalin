"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { PUBLIC_TAG } from "@/lib/queries/public";
import { sanitizeDoc } from "@/lib/rich-text-doc";
import { createClient } from "@/lib/supabase/server";

const aboutSchema = z.object({
  coupleNames: z
    .string()
    .trim()
    .min(1, "Add your names.")
    .max(80, "Keep the names under 80 characters."),
  welcomeLine: z.string().trim().max(200, "Keep the welcome line under 200 characters."),
  ourStory: z.unknown(),
  howWeMet: z.unknown(),
  engagementStory: z.unknown(),
  engagementDate: z.iso.date().nullable(),
  engagementPlace: z
    .string()
    .trim()
    .max(120, "Keep the place under 120 characters.")
    .transform((v) => v || null),
});

export type SaveAboutResult = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"coupleNames" | "welcomeLine" | "engagementPlace", string>>;
};

/** Saves the About page and home page text. Rich text is cleaned first. */
export async function saveAbout(input: z.input<typeof aboutSchema>): Promise<SaveAboutResult> {
  await requireMember();
  const parsed = aboutSchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      error: "Check the highlighted fields.",
      fieldErrors: {
        coupleNames: f.coupleNames?.[0],
        welcomeLine: f.welcomeLine?.[0],
        engagementPlace: f.engagementPlace?.[0],
      },
    };
  }
  const d = parsed.data;
  const db = await createClient();
  const { error } = await db
    .from("site_settings")
    .update({
      couple_names: d.coupleNames,
      welcome_line: d.welcomeLine,
      our_story: sanitizeDoc(d.ourStory),
      how_we_met: sanitizeDoc(d.howWeMet),
      engagement_story: sanitizeDoc(d.engagementStory),
      engagement_date: d.engagementDate,
      engagement_place: d.engagementPlace,
    })
    .eq("id", 1);
  if (error) return { error: "Couldn't save. Try again." };

  updateTag(PUBLIC_TAG);
  return { ok: true };
}

/** Saves the order of the About photos (first in the list shows first). */
export async function reorderAboutPhotos(ids: string[]): Promise<{ error?: string }> {
  await requireMember();
  const parsed = z.array(z.uuid()).max(200).safeParse(ids);
  if (!parsed.success) return { error: "Couldn't save the new order." };
  const db = await createClient();
  const results = await Promise.all(
    parsed.data.map((id, i) =>
      db
        .from("photos")
        .update({ about_sort_order: i + 1 })
        .eq("id", id)
        .eq("show_on_about", true),
    ),
  );
  if (results.some((r) => r.error)) return { error: "Couldn't save the new order. Try again." };
  updateTag(PUBLIC_TAG);
  return {};
}
