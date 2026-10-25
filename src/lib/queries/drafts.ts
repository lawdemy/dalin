import "server-only";
import { requireMember } from "@/lib/auth";
import { PHOTO_COLUMNS, toPhotos, type Photo, type PhotoRow } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { draftPayloadSchemas, type DraftKind, type DraftPayload } from "@/lib/validation";

/** One of my drafts, as listed on the Drafts page. */
export type DraftSummary = {
  id: string;
  kind: DraftKind;
  preview: string;
  updatedAt: string;
  /** Where it opens to continue writing. */
  href: string;
  /** What it belongs to, e.g. the entry title for a comment. */
  context: string | null;
};

type DraftRow = {
  id: string;
  kind: DraftKind;
  target_id: string | null;
  payload: unknown;
  preview: string;
  updated_at: string;
};

const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

/** All my drafts, newest first. Empty until migration 0010 runs. */
export async function listDrafts(): Promise<DraftSummary[]> {
  const me = await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("drafts")
    .select("id, kind, target_id, payload, preview, updated_at")
    .eq("author_id", me.id)
    .order("updated_at", { ascending: false });
  if (error) {
    if (missingTable(error.code)) return [];
    throw new Error(`Couldn't load drafts: ${error.message}`);
  }
  const rows = (data ?? []) as DraftRow[];

  // Titles of what the drafts belong to.
  const idsOf = (kind: DraftKind) =>
    rows.filter((r) => r.kind === kind && r.target_id).map((r) => r.target_id!);
  const [entries, books, notes] = await Promise.all([
    titles(db, "entries", "title", idsOf("comment")),
    titles(db, "books", "title", idsOf("book_note")),
    titles(db, "notes", "message", idsOf("note_reply")),
  ]);

  // A comment, reply or reading note whose entry, note or book has since
  // been deleted has nowhere to go: tidy it away.
  const targets = { comment: entries, book_note: books, note_reply: notes } as const;
  const orphaned = rows.filter(
    (r) => r.target_id && !targets[r.kind as keyof typeof targets]?.has(r.target_id),
  );
  if (orphaned.length) {
    await db
      .from("drafts")
      .delete()
      .in(
        "id",
        orphaned.map((r) => r.id),
      );
  }

  return rows
    .filter((r) => !orphaned.includes(r))
    .map((r) => {
      const t = r.target_id;
      const base = { id: r.id, kind: r.kind, preview: r.preview, updatedAt: r.updated_at };
      switch (r.kind) {
        case "entry":
          return { ...base, href: `/admin/entries/new?draft=${r.id}`, context: null };
        case "note":
          return { ...base, href: `/admin?draft=${r.id}`, context: null };
        case "comment":
          return {
            ...base,
            href: `/admin/entries/${t}#comments`,
            context: entries.get(t!) ?? null,
          };
        case "note_reply":
          return { ...base, href: `/admin#note-${t}`, context: notes.get(t!) ?? null };
        case "book_note":
          return { ...base, href: `/admin/books/${t}#notes`, context: books.get(t!) ?? null };
      }
    });
}

/** How many drafts I have (for the dashboard and menu). */
export async function countDrafts(): Promise<number> {
  const me = await requireMember();
  const db = await createClient();
  const { count, error } = await db
    .from("drafts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", me.id);
  return error ? 0 : (count ?? 0);
}

/** One of my untargeted drafts (a new entry or note), with its payload. */
export async function getDraft<K extends "entry" | "note">(
  id: string,
  kind: K,
): Promise<{ id: string; payload: DraftPayload<K> } | null> {
  const me = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createClient();
  const { data, error } = await db
    .from("drafts")
    .select("id, payload")
    .eq("id", id)
    .eq("author_id", me.id)
    .eq("kind", kind)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = draftPayloadSchemas[kind].safeParse(data.payload);
  return parsed.success ? { id: data.id, payload: parsed.data as DraftPayload<K> } : null;
}

/** My drafts of one targeted kind, by target id (e.g. comment drafts by entry). */
export async function getTargetDrafts<K extends "comment" | "note_reply" | "book_note">(
  kind: K,
  targetIds: string[],
): Promise<Map<string, { id: string; payload: DraftPayload<K> }>> {
  const found = new Map<string, { id: string; payload: DraftPayload<K> }>();
  if (!targetIds.length) return found;
  const me = await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("drafts")
    .select("id, target_id, payload")
    .eq("author_id", me.id)
    .eq("kind", kind)
    .in("target_id", targetIds);
  if (error) return found;
  for (const row of data ?? []) {
    const parsed = draftPayloadSchemas[kind].safeParse(row.payload);
    if (parsed.success && row.target_id)
      found.set(row.target_id, { id: row.id, payload: parsed.data as DraftPayload<K> });
  }
  return found;
}

/** The uploaded photos a new-entry draft refers to that are still unsaved, in order. */
export async function getDraftPhotos(ids: string[]): Promise<Photo[]> {
  if (!ids.length) return [];
  await requireMember();
  const db = await createClient();
  const { data } = await db.from("photos").select(PHOTO_COLUMNS).in("id", ids).is("entry_id", null);
  const photos = toPhotos((data ?? []) as PhotoRow[]);
  return ids.flatMap((id) => photos.find((p) => p.id === id) ?? []);
}

async function titles(
  db: Awaited<ReturnType<typeof createClient>>,
  table: "entries" | "books" | "notes",
  column: "title" | "message",
  ids: string[],
) {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { data } = await db.from(table).select(`id, ${column}`).in("id", ids);
  for (const row of (data ?? []) as unknown as Record<string, string>[]) {
    map.set(row.id, row[column]);
  }
  return map;
}
