"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { PUBLIC_TAG } from "@/lib/queries/public";
import { createClient } from "@/lib/supabase/server";
import { bookNoteSchema, bookSchema, type BookInput } from "@/lib/validation";

export type BookResult = { error?: string; fieldErrors?: Record<string, string>; id?: string };

/** Adds a book, or with an id updates it. Either of us may edit any book. */
export async function saveBook(input: BookInput): Promise<BookResult> {
  await requireMember();
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors };
  }
  const { id, ...b } = parsed.data;
  const row = {
    title: b.title,
    author: b.author,
    status: b.status,
    started_on: b.startedOn,
    finished_on: b.finishedOn,
    buy_url: b.buyUrl,
    quote: b.quote,
    reflection: b.reflection,
    visibility: b.visibility,
  };

  const db = await createClient();
  const { data, error } = id
    ? await db.from("books").update(row).eq("id", id).select("id")
    : await db.from("books").insert(row).select("id");
  if (error?.code === "42P01" || error?.code === "PGRST205")
    return { error: "The bookshelf switches on once migration 0009 has been run in Supabase." };
  if (error || !data?.length) return { error: "Couldn't save the book. Try again." };

  updateTag(PUBLIC_TAG);
  return { id: data[0].id };
}

/** Deletes a book and its reading notes (on delete cascade). */
export async function deleteBook(id: string) {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return;
  const db = await createClient();
  const { error } = await db.from("books").delete().eq("id", id);
  if (error) throw new Error("Couldn't delete the book. Try again.");
  updateTag(PUBLIC_TAG);
  redirect("/admin/books");
}

export type BookNoteResult = { error?: string };

/** Adds a private reading note to a book as the signed-in member. */
export async function addBookNote(
  bookId: string,
  input: z.input<typeof bookNoteSchema>,
): Promise<BookNoteResult> {
  await requireMember();
  if (!z.uuid().safeParse(bookId).success) return { error: "That book couldn't be found." };
  const parsed = bookNoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = await createClient();
  const { error } = await db.from("book_notes").insert({ book_id: bookId, ...parsed.data });
  if (error?.code === "23503") return { error: "That book no longer exists." };
  return error ? { error: "Couldn't save your note. Try again." } : {};
}

/** Edits one of your own reading notes (RLS refuses anyone else's). */
export async function updateBookNote(
  id: string,
  input: z.input<typeof bookNoteSchema>,
): Promise<BookNoteResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That note couldn't be found." };
  const parsed = bookNoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = await createClient();
  const { data, error } = await db.from("book_notes").update(parsed.data).eq("id", id).select("id");
  if (error || !data?.length) return { error: "Couldn't save your changes. Try again." };
  return {};
}

/** Deletes one of your own reading notes. */
export async function deleteBookNote(id: string): Promise<BookNoteResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That note couldn't be found." };
  const db = await createClient();
  const { data, error } = await db.from("book_notes").delete().eq("id", id).select("id");
  if (error || !data?.length) return { error: "Couldn't delete the note. Try again." };
  return {};
}
