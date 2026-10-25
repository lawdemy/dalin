import "server-only";
import { after } from "next/server";
import webpush from "web-push";
import { createPublicClient } from "@/lib/supabase/public";

/*
 * Phone notifications (web push). The database decides what is due through
 * claim_pushes(), which only answers callers holding PUSH_SECRET; the
 * notifications themselves are written by triggers (migration 0011).
 * VAPID keys identify this site to the browsers' push services.
 */

type PushRow = {
  notification_id: string;
  title: string;
  body: string;
  href: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushMessage = { title: string; body: string; href: string; tag?: string };

function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://dalin.pics", publicKey, privateKey);
  return true;
}

/** Sends one message to one device. Returns "gone" when the device unsubscribed. */
export async function pushTo(
  device: { endpoint: string; p256dh: string; auth: string },
  message: PushMessage,
): Promise<"sent" | "gone" | "failed"> {
  if (!configure()) return "failed";
  try {
    await webpush.sendNotification(
      { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
      JSON.stringify(message),
      { TTL: 60 * 60 * 24, urgency: "normal" },
    );
    return "sent";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("Push failed", status ?? e);
    return "failed";
  }
}

/**
 * Pushes every notification that is due and not yet sent. Called right after
 * changes (through `after()`) and every morning by the cron job, for notes
 * scheduled for that day. Safe to call often: each one is sent once.
 */
export async function sendPendingPushes() {
  const secret = process.env.PUSH_SECRET;
  const db = createPublicClient();
  if (!secret || !db || !configure()) return;

  const { data, error } = await db.rpc("claim_pushes", { p_secret: secret });
  if (error) {
    // Migration 0011 not run yet, or the secret doesn't match.
    if (error.code !== "PGRST202") console.error("claim_pushes failed", error.message);
    return;
  }
  const rows = (data ?? []) as PushRow[];
  const results = await Promise.all(
    rows.map((r) =>
      pushTo(r, { title: r.title, body: r.body, href: r.href, tag: r.notification_id }),
    ),
  );
  const gone = rows.filter((_, i) => results[i] === "gone").map((r) => r.endpoint);
  if (gone.length) {
    await db.rpc("drop_push_subscriptions", { p_secret: secret, p_endpoints: gone });
  }
}

/**
 * Sends any due pushes once the current action has finished (the triggers
 * will have written its notifications by then). Call at the start of any
 * Server Action that can notify the other person.
 */
export function pushSoon() {
  after(sendPendingPushes);
}
