"use server";

import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CommentResult = { error?: string };

const bodySchema = z
  .string()
  .trim()
  .min(1, "Write something first.")
  .max(2000, "Keep it under 2,000 characters.");

/** Adds a comment to an entry as the signed-in member. */
export async function addComment(entryId: string, body: string): Promise<CommentResult> {
  await requireMember();
  if (!z.uuid().safeParse(entryId).success) return { error: "That entry couldn't be found." };
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = await createClient();
  const { error } = await db.from("comments").insert({ entry_id: entryId, body: parsed.data });
  if (error?.code === "23503") return { error: "That entry no longer exists." };
  return error ? { error: "Couldn't post your comment. Try again." } : {};
}

/** Edits one of your own comments (RLS refuses anyone else's). */
export async function updateComment(id: string, body: string): Promise<CommentResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That comment couldn't be found." };
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = await createClient();
  const { data, error } = await db
    .from("comments")
    .update({ body: parsed.data })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { error: "Couldn't save your changes. Try again." };
  return {};
}

/** Deletes one of your own comments. */
export async function deleteComment(id: string): Promise<CommentResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That comment couldn't be found." };
  const db = await createClient();
  const { data, error } = await db.from("comments").delete().eq("id", id).select("id");
  if (error || !data?.length) return { error: "Couldn't delete the comment. Try again." };
  return {};
}
