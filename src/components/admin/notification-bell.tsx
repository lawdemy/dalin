"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getUnreadCount } from "@/app/admin/notifications/actions";

/** Fired after notifications are read, so the bell updates straight away. */
export const NOTIFICATIONS_CHANGED = "dalin:notifications-changed";

const POLL_MS = 60_000;

/** Bell with the unread count; also registers the push service worker. */
export function NotificationBell() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    getUnreadCount()
      .then(setCount)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);

    // The service worker shows phone notifications and tells us when one arrives.
    const sw = "serviceWorker" in navigator ? navigator.serviceWorker : null;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "dalin:notification") refresh();
    };
    sw?.register("/sw.js").catch(() => {});
    sw?.addEventListener("message", onMessage);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
      sw?.removeEventListener("message", onMessage);
    };
  }, [refresh]);

  return (
    <Link
      href="/admin/notifications"
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
      className="relative flex size-11 items-center justify-center rounded-xl text-ink hover:bg-linen hover:text-ink"
    >
      <Bell aria-hidden className="size-5.5" strokeWidth={1.8} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent-dark px-1 text-[0.6875rem] leading-none font-semibold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
