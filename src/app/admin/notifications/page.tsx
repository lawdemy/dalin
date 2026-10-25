import type { Metadata } from "next";
import Link from "next/link";
import { NotificationList } from "@/components/admin/notification-list";
import { listNotifications } from "@/lib/queries/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { notifications, setupNeeded } = await listNotifications(); // checks membership
  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-title">Notifications</h1>
        <p className="text-muted">
          What&rsquo;s new from each other. To get these on your phone too, turn them on in{" "}
          <Link href="/admin/settings#notifications">Settings</Link>.
        </p>
      </div>
      {setupNeeded ? (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          Notifications switch on once migration 0011 has been run in Supabase.
        </p>
      ) : (
        <NotificationList notifications={notifications} now={new Date().toISOString()} />
      )}
    </div>
  );
}
