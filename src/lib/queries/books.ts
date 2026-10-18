import "server-only";
import { requireMember } from "@/lib/auth";
import { signedSources, type ImageSource } from "@/lib/cloudinary";
import type { BookStatus } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  startedOn: string | null;
  finishedOn: string | null;
  buyUrl: string | null;
  quote: string | null;
  reflection: string | null;
  visibility: "private" | "public";
};

export type BookRow = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  started_on: string | null;
  finished_on: string | null;
  buy_url: string | null;
  quote: string | null;
  reflection: string | null;
  visibility: "private" | "public";
};

export const BOOK_COLUMNS =
  "id, title, author, status, started_on, finished_on, buy_url, quote, reflection, visibility";

export const toBook = (b: BookRow): Book => ({
  id: b.id,
  title: b.title,
  author: b.author,
  status: b.status,
  startedOn: b.started_on,
  finishedOn: b.finished_on,
  buyUrl: b.buy_url,
  quote: b.quote,
  reflection: b.reflection,
  visibility: b.visibility,
});

/** True for "relation doesn't exist" (migration 0009 not run yet). */
const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

/** Every book, newest first. `setupNeeded` until migration 0009 runs. */
export async function listBooks(): Promise<{ books: Book[]; setupNeeded?: boolean }> {
  await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("books")
    .select(BOOK_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) {
    if (missingTable(error.code)) return { books: [], setupNeeded: true };
    throw new Error(`Couldn't load books: ${error.message}`);
  }
  return { books: ((data ?? []) as BookRow[]).map(toBook) };
}

export async function getBook(id: string): Promise<Book | null> {
  await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createClient();
  const { data, error } = await db.from("books").select(BOOK_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    if (missingTable(error.code)) return null;
    throw new Error(`Couldn't load the book: ${error.message}`);
  }
  return data ? toBook(data as BookRow) : null;
}

export type BookNote = {
  id: string;
  chapter: string | null;
  body: string;
  createdAt: string;
  edited: boolean;
  authorId: string;
  authorName: string;
  authorAvatar: ImageSource[] | null;
};

/** Our private reading notes on a book, oldest first. */
export async function getBookNotes(bookId: string): Promise<BookNote[]> {
  await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("book_notes")
    .select(
      "id, chapter, body, created_at, updated_at, author_id, author:profiles!book_notes_author_id_fkey(display_name, avatar_path)",
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Couldn't load reading notes: ${error.message}`);

  type Author = { display_name: string; avatar_path: string | null };
  return (data ?? []).map((n) => {
    const author = (Array.isArray(n.author) ? n.author[0] : n.author) as Author | null;
    return {
      id: n.id,
      chapter: n.chapter,
      body: n.body,
      createdAt: n.created_at,
      // Allow a second of slack between the two timestamps on insert.
      edited: new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 1000,
      authorId: n.author_id,
      authorName: author?.display_name ?? "",
      authorAvatar: author?.avatar_path ? signedSources(author.avatar_path, 256) : null,
    };
  });
}

/** Reading-note counts for a set of books. */
export async function bookNoteCounts(bookIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!bookIds.length) return counts;
  await requireMember();
  const db = await createClient();
  const { data, error } = await db.from("book_notes").select("book_id").in("book_id", bookIds);
  if (error) return counts;
  for (const { book_id } of data ?? []) counts.set(book_id, (counts.get(book_id) ?? 0) + 1);
  return counts;
}
