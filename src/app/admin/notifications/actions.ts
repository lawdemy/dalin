"use server";

import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { pushTo } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

/** Unread notifications for the bell. Zero until migration 0011 runs. */
export async function getUnreadCount(): Promise<number> {
  const me = await requireMember();
  const db = await createClient();
  const { count, error } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", me.id)
    .is("read_at", null);
  return error ? 0 : (count ?? 0);
}

export async function markNotificationRead(id: string): Promise<void> {
  const me = await requireMember();
  if (!z.uuid().safeParse(id).success) return;
  const db = await createClient();
  await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", me.id)
    .is("read_at", null);
}

export async function markAllNotificationsRead(): Promise<void> {
  const me = await requireMember();
  const db = await createClient();
  await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", me.id)
    .is("read_at", null);
}

export async function clearReadNotifications(): Promise<void> {
  const me = await requireMember();
  const db = await createClient();
  await db.from("notifications").delete().eq("recipient_id", me.id).not("read_at", "is", null);
}

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

export type PushResult = { error?: string };

/** Turns phone notifications on for this device (for the signed-in member). */
export async function savePushSubscription(
  subscription: unknown,
  userAgent: string,
): Promise<PushResult> {
  await requireMember();
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { error: "This device's notification details weren't valid." };
  const db = await createClient();
  const { error } = await db.rpc("save_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.keys.p256dh,
    p_auth: parsed.data.keys.auth,
    p_user_agent: userAgent.slice(0, 300),
  });
  if (error?.code === "PGRST202")
    return { error: "Notifications switch on once migration 0011 has been run." };
  return error ? { error: "Couldn't turn on notifications. Try again." } : {};
}

/** Turns phone notifications off for this device. */
export async function removePushSubscription(endpoint: string): Promise<PushResult> {
  const me = await requireMember();
  if (typeof endpoint !== "string" || endpoint.length > 1000) return {};
  const db = await createClient();
  const { error } = await db
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("profile_id", me.id);
  return error ? { error: "Couldn't turn off notifications. Try again." } : {};
}

/** Sends a test notification to each of my devices. */
export async function sendTestPush(): Promise<PushResult & { sent?: number }> {
  const me = await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile_id", me.id);
  if (error || !data?.length) return { error: "No devices have notifications turned on yet." };
  const results = await Promise.all(
    data.map((d) =>
      pushTo(d, {
        title: "Notifications are on",
        body: `You'll hear here when something happens in DaLin, ${me.displayName}.`,
        href: "/admin/notifications",
      }),
    ),
  );
  const gone = data.filter((_, i) => results[i] === "gone").map((d) => d.endpoint);
  if (gone.length) await db.from("push_subscriptions").delete().in("endpoint", gone);
  const sent = results.filter((r) => r === "sent").length;
  return sent
    ? { sent }
    : { error: "The test didn't go through. Check the push keys are set in Vercel." };
}
