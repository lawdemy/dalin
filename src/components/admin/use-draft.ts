"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { discardDraft, saveDraft } from "@/app/admin/drafts/actions";
import type { DraftKind } from "@/lib/validation";

export type DraftStatus = "idle" | "saving" | "saved" | "error";

type UseDraftOptions = {
  kind: DraftKind;
  /** The entry, note or book a comment/reply/reading note belongs to. */
  targetId?: string | null;
  /** The draft's id: required up front for new entries and notes, else the existing draft's. */
  id?: string | null;
  /** Everything typed so far. Saved a moment after it stops changing. */
  payload: unknown;
  /** False to switch saving off (e.g. while the composer is closed). */
  enabled?: boolean;
};

/** Pause after the last keystroke before saving, like Gmail. */
const SAVE_DELAY_MS = 1200;

/**
 * Saves what's being written as a draft while you type, so nothing is lost
 * if the page closes, the phone locks or you navigate away. Saves after a
 * short pause, when the page is hidden or left, and when the connection
 * comes back. The content it starts with counts as already saved.
 */
export function useDraft({
  kind,
  targetId = null,
  id = null,
  payload,
  enabled = true,
}: UseDraftOptions) {
  const serialized = JSON.stringify(payload);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [error, setError] = useState<string>();
  const [draftId, setDraftId] = useState<string | null>(id);

  const lastSaved = useRef(serialized);
  const latest = useRef({ serialized, payload, kind, targetId, id: draftId, enabled });
  const current = useRef<Promise<void> | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    latest.current = { serialized, payload, kind, targetId, id: draftId, enabled };
  });

  // A different draft was opened in the same box.
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setDraftId(id);
  }

  const flush = useCallback(async (): Promise<void> => {
    // One save at a time: wait for any in flight, then save whatever is newest.
    while (current.current) await current.current;
    const now = latest.current;
    if (!now.enabled || paused.current || now.serialized === lastSaved.current) return;
    const run = (async () => {
      setStatus("saving");
      try {
        const res = await saveDraft({
          id: now.id ?? undefined,
          kind: now.kind,
          targetId: now.targetId,
          payload: now.payload,
        });
        if (res.error) {
          setStatus("error");
          setError(res.error);
          return;
        }
        lastSaved.current = now.serialized;
        if (res.id !== undefined && res.id !== now.id && (res.id || now.targetId)) {
          setDraftId(res.id);
          latest.current = { ...latest.current, id: res.id };
        }
        setError(undefined);
        setStatus(res.id ? "saved" : "idle");
      } catch {
        setStatus("error");
        setError("Offline. Your draft will save when you're back online.");
      }
    })();
    current.current = run;
    await run;
    current.current = null;
  }, []);

  // Save a moment after typing stops.
  useEffect(() => {
    if (!enabled || serialized === lastSaved.current) return;
    const timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [serialized, enabled, flush]);

  // Save straight away when the page is hidden, left or closed, or the
  // connection comes back; and when this form goes away inside the app.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const now = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", now);
    window.addEventListener("online", now);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", now);
      window.removeEventListener("online", now);
      void flush();
    };
  }, [flush]);

  /** Stop saving (e.g. while sending) once any save in flight has finished. */
  const pause = useCallback(async () => {
    paused.current = true;
    if (current.current) await current.current;
  }, []);

  /** Start saving again; the content at this moment counts as saved. */
  const resume = useCallback(() => {
    lastSaved.current = latest.current.serialized;
    paused.current = false;
  }, []);

  /** Deletes the draft (after sending, or when discarded). Call pause() first. */
  const discard = useCallback(async () => {
    const draft = latest.current.id;
    if (draft) await discardDraft(draft);
    if (latest.current.targetId) setDraftId(null);
    setStatus("idle");
    setError(undefined);
  }, []);

  return { status, error, draftId, pause, resume, discard, flush };
}
