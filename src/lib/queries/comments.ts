import "server-only";
import { requireMember } from "@/lib/auth";
import { signedSources, type ImageSource } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  edited: boolean;
  authorId: string;
  authorName: string;
  authorAvatar: ImageSource[] | null;
};

/** Comments on an entry, oldest first. `setupNeeded` until migration 0007 runs. */
export async function getComments(
  entryId: string,
): Promise<{ comments: Comment[]; setupNeeded?: boolean }> {
  await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("comments")
    .select(
      "id, body, created_at, updated_at, author_id, author:profiles!comments_author_id_fkey(display_name, avatar_path)",
    )
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205")
      return { comments: [], setupNeeded: true };
    throw new Error(`Couldn't load comments: ${error.message}`);
  }

  type Author = { display_name: string; avatar_path: string | null };
  return {
    comments: (data ?? []).map((c) => {
      const author = (Array.isArray(c.author) ? c.author[0] : c.author) as Author | null;
      return {
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        // Allow a second of slack between the two timestamps on insert.
        edited: new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 1000,
        authorId: c.author_id,
        authorName: author?.display_name ?? "",
        authorAvatar: author?.avatar_path ? signedSources(author.avatar_path, 256) : null,
      };
    }),
  };
}

/** Comment counts for a set of entries. Missing table → no counts. */
export async function commentCounts(entryIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!entryIds.length) return counts;
  await requireMember();
  const db = await createClient();
  const { data, error } = await db.from("comments").select("entry_id").in("entry_id", entryIds);
  if (error) return counts;
  for (const { entry_id } of data ?? []) counts.set(entry_id, (counts.get(entry_id) ?? 0) + 1);
  return counts;
}
