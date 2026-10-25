"use client";

import { BellOff, BellRing, Send } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
} from "@/app/admin/notifications/actions";
import { Button } from "@/components/ui/button";

type State =
  | "checking"
  | "unsupported" // this browser can't do web push
  | "needs-install" // iPhone/iPad: only works from the Home Screen app
  | "blocked" // permission denied in browser settings
  | "off"
  | "on";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Turns phone/computer notifications on or off for this device. */
export function PushSettings() {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      let next: State;
      if (!supported) next = isIos() && !isStandalone() ? "needs-install" : "unsupported";
      else if (Notification.permission === "denied") next = "blocked";
      else {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        next = sub ? "on" : "off";
      }
      if (!cancelled) setState(next);
    })().catch(() => {
      if (!cancelled) setState("unsupported");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function turnOn() {
    setError(undefined);
    setMessage(undefined);
    startTransition(async () => {
      try {
        if (!VAPID_KEY) {
          setError("Push isn't set up on the server yet (missing VAPID keys).");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "blocked" : "off");
          return;
        }
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes(VAPID_KEY),
          }));
        const res = await savePushSubscription(sub.toJSON(), navigator.userAgent);
        if (res.error) {
          setError(res.error);
          return;
        }
        setState("on");
        setMessage("Notifications are on for this device.");
      } catch {
        setError("Couldn't turn on notifications on this device.");
      }
    });
  }

  function turnOff() {
    setError(undefined);
    setMessage(undefined);
    startTransition(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    });
  }

  function test() {
    setError(undefined);
    setMessage(undefined);
    startTransition(async () => {
      const res = await sendTestPush();
      if (res.error) setError(res.error);
      else setMessage(`Test sent to ${res.sent} device${res.sent === 1 ? "" : "s"}.`);
    });
  }

  return (
    <section id="notifications" className="flex scroll-mt-20 flex-col gap-3">
      <h2 className="text-section">Phone notifications</h2>
      <p className="text-muted">
        Get a notification on this device when the other one of you writes an entry, leaves a note,
        comments, replies, updates About us or the bookshelf, and when someone applies to the
        foundation. Turn it on separately on each phone or computer.
      </p>

      {state === "needs-install" && (
        <div className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          <p className="font-medium text-ink">On iPhone, add DaLin to your Home Screen first:</p>
          <ol className="mt-1 list-decimal pl-5">
            <li>In Safari, tap the Share button.</li>
            <li>Choose &ldquo;Add to Home Screen&rdquo;, then Add.</li>
            <li>Open DaLin from the new Home Screen icon and come back to this page.</li>
          </ol>
        </div>
      )}
      {state === "unsupported" && (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          This browser can&rsquo;t show notifications. Try Chrome on Android, Safari on iPhone (from
          the Home Screen), or Chrome, Edge or Firefox on a computer.
        </p>
      )}
      {state === "blocked" && (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          Notifications are blocked for this site. Allow them in your browser&rsquo;s site settings,
          then reload this page.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {state === "off" && (
          <Button onClick={turnOn} pending={pending}>
            <BellRing aria-hidden className="size-4.5" strokeWidth={1.8} />
            Turn on notifications
          </Button>
        )}
        {state === "on" && (
          <>
            <Button variant="secondary" onClick={test} pending={pending}>
              <Send aria-hidden className="size-4.5" strokeWidth={1.8} />
              Send a test
            </Button>
            <Button variant="ghost" onClick={turnOff} disabled={pending}>
              <BellOff aria-hidden className="size-4.5" strokeWidth={1.8} />
              Turn off on this device
            </Button>
          </>
        )}
      </div>
      <p aria-live="polite" className="text-caption text-muted">
        {state === "on" && !message && "On for this device."}
        {message}
      </p>
      {error && (
        <p role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </section>
  );
}
