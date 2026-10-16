"use server";

import { addYears, format } from "date-fns";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type NoteResult = { error?: string };

const noteSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Write a few words first.")
    .max(1000, "Keep it under 1,000 characters."),
  deliverOn: z.iso.date("Pick the morning it should appear."),
});

/** Writes a note for the other one of us, to appear on the chosen morning. */
export async function saveNote(input: z.input<typeof noteSchema>): Promise<NoteResult> {
  const me = await requireMember();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { message, deliverOn } = parsed.data;

  const today = todayInDiary();
  const latest = format(addYears(new Date(`${today}T12:00:00`), 2), "yyyy-MM-dd");
  if (deliverOn < today) return { error: "Pick today or a later day." };
  if (deliverOn > latest) return { error: "Pick a day within the next two years." };

  const db = await createClient();
  const { data: partner } = await db
    .from("profiles")
    .select("id")
    .neq("id", me.id)
    .limit(1)
    .maybeSingle();
  if (!partner) return { error: "There's no one to send it to yet." };

  const { error } = await db
    .from("notes")
    .insert({ recipient_id: partner.id, message, deliver_on: deliverOn });
  return error ? { error: "Couldn't save the note. Try again." } : {};
}

/** Deletes a note you wrote (RLS refuses anyone else's). */
export async function deleteNote(id: string): Promise<NoteResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That note couldn't be found." };
  const db = await createClient();
  const { error } = await db.from("notes").delete().eq("id", id);
  return error ? { error: "Couldn't delete the note. Try again." } : {};
}

const replySchema = z
  .string()
  .trim()
  .min(1, "Write your reply first.")
  .max(1000, "Keep it under 1,000 characters.");

/**
 * Sends your one reply to a note written for you. The database allows a
 * single reply per note, only from its recipient, and only once delivered.
 */
export async function replyToNote(id: string, reply: string): Promise<NoteResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That note couldn't be found." };
  const parsed = replySchema.safeParse(reply);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = await createClient();
  const { data, error } = await db
    .from("notes")
    .update({ reply: parsed.data })
    .eq("id", id)
    .select("id");
  if (error?.message?.includes("already has a reply")) {
    return { error: "You've already replied to this note." };
  }
  if (error || !data?.length) return { error: "Couldn't send your reply. Try again." };
  return {};
}
