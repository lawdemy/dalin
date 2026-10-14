import "server-only";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type Note = { id: string; message: string; deliverOn: string };

export type DashboardNotes = {
  /** The other one of us, or null if their profile doesn't exist yet. */
  partner: { id: string; name: string } | null;
  /** Notes to me that arrive today. */
  today: Note[];
  /** Notes to me from earlier days, newest first. */
  earlier: Note[];
  /** Notes I've written that haven't arrived yet (or arrive today). */
  scheduled: Note[];
  /** True when the notes table doesn't exist yet (migration 0006 not run). */
  setupNeeded?: boolean;
};

const EMPTY: DashboardNotes = { partner: null, today: [], earlier: [], scheduled: [] };

/** Notes for the dashboard. RLS already hides notes to me that aren't due yet. */
export async function getDashboardNotes(): Promise<DashboardNotes> {
  const me = await requireMember();
  const db = await createClient();
  const today = todayInDiary();

  const [partner, received, sent] = await Promise.all([
    db.from("profiles").select("id, display_name").neq("id", me.id).limit(1).maybeSingle(),
    db
      .from("notes")
      .select("id, message, deliver_on")
      .eq("recipient_id", me.id)
      .lte("deliver_on", today)
      .order("deliver_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(40),
    db
      .from("notes")
      .select("id, message, deliver_on")
      .eq("author_id", me.id)
      .gte("deliver_on", today)
      .order("deliver_on", { ascending: true })
      .limit(30),
  ]);
  for (const r of [partner, received, sent]) {
    if (!r.error) continue;
    // Table missing: the dashboard still works, it just can't show notes yet.
    if (r.error.code === "42P01" || r.error.code === "PGRST205")
      return { ...EMPTY, setupNeeded: true };
    throw new Error(`Couldn't load notes: ${r.error.message}`);
  }

  const toNote = (n: { id: string; message: string; deliver_on: string }): Note => ({
    id: n.id,
    message: n.message,
    deliverOn: n.deliver_on,
  });
  const mine = (received.data ?? []).map(toNote);

  return {
    partner: partner.data ? { id: partner.data.id, name: partner.data.display_name } : null,
    today: mine.filter((n) => n.deliverOn === today),
    earlier: mine.filter((n) => n.deliverOn < today),
    scheduled: (sent.data ?? []).map(toNote),
  };
}
