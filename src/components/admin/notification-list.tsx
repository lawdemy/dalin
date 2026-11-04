"use client";

import {
  Bell,
  BookOpen,
  Camera,
  CheckCheck,
  Eye,
  GraduationCap,
  Heart,
  Library,
  MessageCircle,
  MessageCircleHeart,
  NotebookPen,
  PenLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  clearReadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/admin/notifications/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TIME_ZONE } from "@/lib/constants";
import type { AppNotification } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS_CHANGED } from "./notification-bell";

const ICONS: Record<string, LucideIcon> = {
  entry_created: BookOpen,
  entry_updated: PenLine,
  comment: MessageCircle,
  note_received: Heart,
  note_reply: MessageCircleHeart,
  about_updated: PenLine,
  moments_toggled: Eye,
  photo_shared: Camera,
  book_added: Library,
  book_finished: Library,
  book_updated: Library,
  book_note: NotebookPen,
  vision_added: Sparkles,
  vision_achieved: Sparkles,
  vision_updated: Sparkles,
  application: GraduationCap,
};

const day = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const time = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const date = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function when(iso: string, now: Date) {
  const d = new Date(iso);
  return day.format(d) === day.format(now) ? `Today, ${time.format(d)}` : date.format(d);
}

export function NotificationList({
  notifications,
  now: nowIso,
}: {
  notifications: AppNotification[];
  now: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const now = new Date(nowIso);
  const unread = notifications.filter((n) => !n.read).length;
  const read = notifications.length - unread;

  function changed() {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Nothing new"
        description="When one of you writes, comments, replies or changes something, it shows here."
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!unread}
          pending={pending}
          onClick={() =>
            startTransition(async () => {
              await markAllNotificationsRead();
              changed();
            })
          }
        >
          <CheckCheck aria-hidden className="size-4.5" strokeWidth={1.8} />
          Mark all as read
        </Button>
        {read > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await clearReadNotifications();
                changed();
              })
            }
          >
            Clear read
          </Button>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-divider border-y border-divider">
        {notifications.map((n) => {
          const Icon = ICONS[n.kind] ?? Bell;
          return (
            <li key={n.id}>
              <Link
                href={n.href}
                onClick={() => {
                  if (!n.read)
                    void markNotificationRead(n.id).then(() =>
                      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED)),
                    );
                }}
                className={cn(
                  "-mx-2 flex items-start gap-3 rounded-xl px-2 py-3 text-ink no-underline hover:bg-linen hover:text-ink",
                  !n.read && "bg-rose-tint/50",
                )}
              >
                <Icon
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-accent"
                  strokeWidth={1.6}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("break-words", !n.read && "font-semibold")}>{n.title}</span>
                  {n.body && (
                    <span className="line-clamp-2 text-label break-words text-ink-soft">
                      {n.body}
                    </span>
                  )}
                  <time dateTime={n.createdAt} className="text-caption text-muted">
                    {when(n.createdAt, now)}
                  </time>
                </span>
                {!n.read && (
                  <span
                    role="img"
                    aria-label="Unread"
                    className="mt-2 size-2.5 shrink-0 rounded-full bg-accent"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
