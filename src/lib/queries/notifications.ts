import "server-only";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
};

const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

/** My notifications, newest first (RLS hides notes that aren't due yet). */
export async function listNotifications(
  limit = 100,
): Promise<{ notifications: AppNotification[]; setupNeeded?: boolean }> {
  const me = await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("notifications")
    .select("id, kind, title, body, href, created_at, read_at")
    .eq("recipient_id", me.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (missingTable(error.code)) return { notifications: [], setupNeeded: true };
    throw new Error(`Couldn't load notifications: ${error.message}`);
  }
  return {
    notifications: (data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      createdAt: n.created_at,
      read: n.read_at !== null,
    })),
  };
}

/** My devices with phone notifications switched on. */
export async function listMyDevices(): Promise<{ endpoint: string; userAgent: string | null }[]> {
  const me = await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("push_subscriptions")
    .select("endpoint, user_agent")
    .eq("profile_id", me.id);
  if (error) return [];
  return (data ?? []).map((d) => ({ endpoint: d.endpoint, userAgent: d.user_agent }));
}
