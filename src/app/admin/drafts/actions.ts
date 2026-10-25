"use server";

import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { destroyAssets } from "@/lib/cloudinary";
import { docText, sanitizeDoc } from "@/lib/rich-text-doc";
import { createClient } from "@/lib/supabase/server";
import {
  DRAFT_KINDS,
  TARGETED_DRAFT_KINDS,
  draftPayloadSchemas,
  type DraftKind,
} from "@/lib/validation";

export type SaveDraftResult = {
  /** The draft's id; null when the draft was empty and has been removed. */
  id?: string | null;
  /** When the server saved it (ISO). */
  savedAt?: string;
  error?: string;
};

const inputSchema = z.object({
  id: z.uuid().optional(),
  kind: z.enum(DRAFT_KINDS),
  targetId: z.uuid().nullable().optional(),
  payload: z.unknown(),
});

/** True for "relation doesn't exist" (migration 0010 not run yet). */
const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";
const SETUP = "Drafts switch on once migration 0010 has been run.";

/**
 * Saves what you're writing as a draft (called automatically while you type).
 * Only you can see your drafts. An empty draft is removed instead of saved.
 */
export async function saveDraft(input: z.input<typeof inputSchema>): Promise<SaveDraftResult> {
  const me = await requireMember();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "Couldn't save the draft." };
  const { id, kind } = parsed.data;
  const targeted = TARGETED_DRAFT_KINDS.includes(kind);
  const targetId = targeted ? parsed.data.targetId : null;
  if (targeted ? !targetId : !id) return { error: "Couldn't save the draft." };

  const clean = cleanPayload(kind, parsed.data.payload);
  if (!clean) return { error: "Couldn't save the draft." };
  const { payload, preview, empty } = clean;

  const db = await createClient();

  if (empty) {
    const q = db.from("drafts").delete().eq("author_id", me.id).eq("kind", kind);
    const { error } = await (targeted ? q.eq("target_id", targetId!) : q.eq("id", id!));
    if (error && !missingTable(error.code)) return { error: "Couldn't update the draft." };
    return { id: null, savedAt: new Date().toISOString() };
  }

  async function update() {
    const q = db
      .from("drafts")
      .update({ payload, preview })
      .eq("author_id", me.id)
      .eq("kind", kind);
    return (targeted ? q.eq("target_id", targetId!) : q.eq("id", id!)).select("id");
  }

  let { data, error } = await update();
  if (!error && !data?.length) {
    const inserted = await db
      .from("drafts")
      .insert({ ...(targeted ? {} : { id }), kind, target_id: targetId, payload, preview })
      .select("id");
    // Another save got there first: update that one instead.
    ({ data, error } = inserted.error?.code === "23505" ? await update() : inserted);
  }
  if (error) {
    if (missingTable(error.code)) return { error: SETUP };
    // The entry, note or book was deleted while you were writing.
    if (error.code === "23503") return { error: "That no longer exists." };
    return { error: "Couldn't save the draft." };
  }
  if (!data?.length) return { error: "Couldn't save the draft." };
  return { id: data[0].id, savedAt: new Date().toISOString() };
}

/**
 * Discards one of your drafts. A new-entry draft also takes its uploaded
 * photos with it, as long as they were never saved into an entry.
 */
export async function discardDraft(id: string): Promise<{ error?: string }> {
  const me = await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That draft couldn't be found." };
  const db = await createClient();
  const { data, error } = await db
    .from("drafts")
    .delete()
    .eq("id", id)
    .eq("author_id", me.id)
    .select("kind, payload");
  if (error) return { error: "Couldn't discard the draft. Try again." };

  const photoIds = (data ?? [])
    .filter((d) => d.kind === "entry")
    .flatMap((d) => {
      const photos = (d.payload as { photos?: { id?: unknown }[] } | null)?.photos;
      return Array.isArray(photos) ? photos.map((p) => p?.id) : [];
    })
    .filter((v): v is string => typeof v === "string" && z.uuid().safeParse(v).success);
  if (photoIds.length) {
    const { data: removed } = await db
      .from("photos")
      .delete()
      .in("id", photoIds)
      .is("entry_id", null)
      .select("storage_path");
    await destroyAssets((removed ?? []).map((r) => r.storage_path));
  }
  return {};
}

// Helpers -------------------------------------------------------------------------------

function cleanPayload(kind: DraftKind, raw: unknown) {
  const parsed = draftPayloadSchemas[kind].safeParse(raw);
  if (!parsed.success) return null;
  const p = parsed.data;
  const squash = (...parts: (string | null | undefined)[]) =>
    parts.filter(Boolean).join(" · ").replace(/\s+/g, " ").trim().slice(0, 200);

  switch (kind) {
    case "entry": {
      const e = p as z.output<(typeof draftPayloadSchemas)["entry"]>;
      const body = sanitizeDoc(e.body);
      const text = docText(body);
      return {
        payload: { ...e, body },
        preview: squash(e.title.trim() || "(No title)", text),
        empty: !e.title.trim() && !text && !e.location.trim() && e.photos.length === 0,
      };
    }
    case "note": {
      const n = p as z.output<(typeof draftPayloadSchemas)["note"]>;
      return { payload: n, preview: squash(n.message), empty: !n.message.trim() };
    }
    case "comment": {
      const c = p as z.output<(typeof draftPayloadSchemas)["comment"]>;
      return { payload: c, preview: squash(c.body), empty: !c.body.trim() };
    }
    case "note_reply": {
      const r = p as z.output<(typeof draftPayloadSchemas)["note_reply"]>;
      return { payload: r, preview: squash(r.reply), empty: !r.reply.trim() };
    }
    case "book_note": {
      const b = p as z.output<(typeof draftPayloadSchemas)["book_note"]>;
      return { payload: b, preview: squash(b.chapter, b.body), empty: !b.body.trim() };
    }
  }
}
