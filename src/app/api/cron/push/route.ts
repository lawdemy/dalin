import { sendPendingPushes } from "@/lib/push";

/**
 * Called by Vercel Cron every morning (vercel.json) so notes scheduled for
 * today reach the other person's phone. Vercel sends CRON_SECRET as a
 * bearer token; anyone else gets 401.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await sendPendingPushes();
  return Response.json({ ok: true });
}
