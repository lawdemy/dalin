import "server-only";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type Note = {
  id: string;
  message: string;
  deliverOn: string;
  /** The recipient's one reply, if they've sent it. */
  reply: string | null;
  repliedAt: string | null;
};

export type DashboardNotes = {
  /** The other one of us, or null if their profile doesn't exist yet. */
  partner: { id: string; name: string } | null;
  /** Notes to me that arrive today. */
  today: Note[];
  /** Notes to me from earlier days, newest first. */
  earlier: Note[];
  /** Notes I've written that haven't arrived yet (or arrive today). */
  scheduled: Note[];
  /** Notes I've written that have been delivered, newest first. */
  sent: Note[];
  /** My notes answered in the last week, newest reply first. */
  recentReplies: Note[];
  /** True when the notes table doesn't exist yet (migration 0006 not run). */
  setupNeeded?: boolean;
  /** True when replies aren't available yet (migration 0008 not run). */
  repliesUnavailable?: boolean;
};

const EMPTY: DashboardNotes = {
  partner: null,
  today: [],
  earlier: [],
  scheduled: [],
  sent: [],
  recentReplies: [],
};

/** Replies newer than this show as cards on the dashboard. */
const RECENT_REPLY_MS = 7 * 86_400_000;

type Row = {
  id: string;
  message: string;
  deliver_on: string;
  reply?: string | null;
  replied_at?: string | null;
};

const toNote = (n: Row): Note => ({
  id: n.id,
  message: n.message,
  deliverOn: n.deliver_on,
  reply: n.reply ?? null,
  repliedAt: n.replied_at ?? null,
});

/** Notes for the dashboard. RLS already hides notes to me that aren't due yet. */
export async function getDashboardNotes(): Promise<DashboardNotes> {
  const me = await requireMember();
  const db = await createClient();
  const today = todayInDiary();

  async function load(columns: string) {
    return Promise.all([
      db
        .from("notes")
        .select(columns)
        .eq("recipient_id", me.id)
        .lte("deliver_on", today)
        .order("deliver_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(40),
      db
        .from("notes")
        .select(columns)
        .eq("author_id", me.id)
        .gte("deliver_on", today)
        .order("deliver_on", { ascending: true })
        .limit(30),
      db
        .from("notes")
        .select(columns)
        .eq("author_id", me.id)
        .lte("deliver_on", today)
        .order("deliver_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(40),
    ]);
  }

  const partner = await db
    .from("profiles")
    .select("id, display_name")
    .neq("id", me.id)
    .limit(1)
    .maybeSingle();
  if (partner.error) throw new Error(`Couldn't load profiles: ${partner.error.message}`);

  let repliesUnavailable = false;
  let results = await load("id, message, deliver_on, reply, replied_at");
  // Reply columns missing (0008 not run yet): notes still work without them.
  if (results.some((r) => r.error?.code === "42703")) {
    repliesUnavailable = true;
    results = await load("id, message, deliver_on");
  }
  for (const r of results) {
    if (!r.error) continue;
    // Table missing: the dashboard still works, it just can't show notes yet.
    if (r.error.code === "42P01" || r.error.code === "PGRST205")
      return { ...EMPTY, setupNeeded: true };
    throw new Error(`Couldn't load notes: ${r.error.message}`);
  }

  const [received, scheduled, sent] = results.map((r) =>
    ((r.data ?? []) as unknown as Row[]).map(toNote),
  );
  const since = Date.now() - RECENT_REPLY_MS;
  const answered = sent.filter((n) => n.repliedAt && new Date(n.repliedAt).getTime() >= since);

  return {
    partner: partner.data ? { id: partner.data.id, name: partner.data.display_name } : null,
    today: received.filter((n) => n.deliverOn === today),
    earlier: received.filter((n) => n.deliverOn < today),
    scheduled,
    // Today's sent notes are in `scheduled` until tomorrow, unless answered.
    sent: sent.filter((n) => n.deliverOn < today || n.reply),
    recentReplies: answered.sort((a, b) => (b.repliedAt ?? "").localeCompare(a.repliedAt ?? "")),
    repliesUnavailable,
  };
}
