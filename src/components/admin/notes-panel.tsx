"use client";

import { format, parseISO } from "date-fns";
import { Heart, MessageCircleHeart, PenLine, Reply, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { deleteNote, replyToNote, saveNote } from "@/app/admin/notes/actions";
import { Button } from "@/components/ui/button";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import type { DashboardNotes, Note } from "@/lib/queries/notes";
import { DraftStatus } from "./draft-status";
import { useDraft } from "./use-draft";

export type ReplyDraft = { id: string; reply: string };
export type NoteDraft = { id: string; message: string; deliverOn: string };

type NotesPanelProps = {
  notes: DashboardNotes;
  /** yyyy-mm-dd in the diary's time zone. */
  today: string;
  tomorrow: string;
  /** My unfinished replies, by note id. */
  replyDrafts?: Record<string, ReplyDraft>;
  /** A note draft to reopen (from /admin/drafts). */
  noteDraft?: NoteDraft | null;
};

/** Today's notes from your partner, replies to yours, and writing your own. */
export function NotesPanel({
  notes,
  today,
  tomorrow,
  replyDrafts = {},
  noteDraft,
}: NotesPanelProps) {
  const { partner } = notes;
  if (!partner) return null;
  const canReply = !notes.repliesUnavailable;

  return (
    <div className="flex flex-col gap-3">
      {notes.today.map((note) => (
        <figure
          key={note.id}
          id={`note-${note.id}`}
          className="flex scroll-mt-20 flex-col gap-2 rounded-xl bg-rose-tint px-5 py-5 md:px-6"
        >
          <figcaption className="flex items-center gap-2 text-caption font-medium tracking-[1px] text-danger-text uppercase">
            <Heart aria-hidden className="size-4" strokeWidth={2} fill="currentColor" />A note from{" "}
            {partner.name}
          </figcaption>
          <blockquote className="font-serif text-quote leading-snug font-medium whitespace-pre-line">
            {note.message}
          </blockquote>
          <p className="text-label font-medium text-danger-text">— {partner.name}</p>
          {canReply && (
            <ReplyBox note={note} partnerName={partner.name} draft={replyDrafts[note.id]} />
          )}
        </figure>
      ))}

      {notes.recentReplies.map((note) => (
        <figure
          key={note.id}
          className="flex flex-col gap-2 rounded-xl border border-rose-tint bg-ivory px-5 py-5 md:px-6"
        >
          <figcaption className="flex items-center gap-2 text-caption font-medium tracking-[1px] text-danger-text uppercase">
            <MessageCircleHeart aria-hidden className="size-4" strokeWidth={2} />
            {partner.name} replied to your note
          </figcaption>
          <p className="text-caption whitespace-pre-line text-muted">
            You wrote: &ldquo;{excerpt(note.message)}&rdquo;
          </p>
          <blockquote className="font-serif text-quote leading-snug font-medium whitespace-pre-line">
            {note.reply}
          </blockquote>
          <p className="text-label font-medium text-danger-text">— {partner.name}</p>
        </figure>
      ))}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <NoteComposer
          partnerName={partner.name}
          today={today}
          tomorrow={tomorrow}
          scheduled={notes.scheduled}
          resume={noteDraft}
        />
        {notes.earlier.length > 0 && (
          <EarlierNotes
            partnerName={partner.name}
            notes={notes.earlier}
            canReply={canReply}
            replyDrafts={replyDrafts}
          />
        )}
        {notes.sent.length > 0 && <SentNotes partnerName={partner.name} notes={notes.sent} />}
      </div>
    </div>
  );
}

function excerpt(text: string, max = 120) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Your one reply to a note written for you. Final once sent. */
function ReplyBox({
  note,
  partnerName,
  draft,
}: {
  note: Note;
  partnerName: string;
  /** My unfinished reply, if I started one. */
  draft?: ReplyDraft;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(draft));
  const [text, setText] = useState(draft?.reply ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const autosave = useDraft({
    kind: "note_reply",
    targetId: note.id,
    id: draft?.id,
    payload: { reply: text },
    enabled: !note.reply,
  });

  if (note.reply) {
    return (
      <div className="mt-1 rounded-xl bg-ivory/70 px-4 py-3">
        <p className="text-caption font-medium text-muted">Your reply</p>
        <p className="whitespace-pre-line">{note.reply}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="-ml-2 self-start text-danger-text hover:text-danger-text"
      >
        <Reply aria-hidden className="size-4.5" strokeWidth={1.8} />
        {text.trim() ? "Continue your reply (draft)" : `Reply to ${partnerName}`}
      </Button>
    );
  }

  function send() {
    setError(undefined);
    startTransition(async () => {
      await autosave.pause();
      const res = await replyToNote(note.id, text);
      if (res.error) {
        setError(res.error);
        autosave.resume();
      } else {
        await autosave.discard();
        router.refresh();
      }
    });
  }

  function discard() {
    startTransition(async () => {
      await autosave.pause();
      await autosave.discard();
      setText("");
      setOpen(false);
      autosave.resume();
    });
  }

  const id = `reply-${note.id}`;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="mt-1 flex flex-col gap-2"
    >
      <label htmlFor={id} className="text-label font-medium">
        Your reply to {partnerName}
      </label>
      <Textarea
        id={id}
        rows={3}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write from the heart…"
        className="bg-ivory font-serif text-quote"
      />
      <p className="text-caption text-muted">
        You can reply once, and it can&rsquo;t be changed after sending.
      </p>
      {error && (
        <p role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" pending={pending} disabled={!text.trim()}>
          Send reply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void autosave.flush();
            setOpen(false);
          }}
          disabled={pending}
        >
          Close
        </Button>
        {text.trim() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={discard}
            disabled={pending}
            className="text-danger-text hover:text-danger-text"
          >
            Discard
          </Button>
        )}
        <DraftStatus status={autosave.status} error={autosave.error} />
      </div>
    </form>
  );
}

function EarlierNotes({
  partnerName,
  notes,
  canReply,
  replyDrafts,
}: {
  partnerName: string;
  notes: Note[];
  canReply: boolean;
  replyDrafts: Record<string, ReplyDraft>;
}) {
  // Open the list when a reply draft is waiting in it.
  const hasDraft = canReply && notes.some((n) => !n.reply && replyDrafts[n.id]);
  return (
    <details className="group w-full" open={hasDraft || undefined}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center text-label font-medium text-accent-dark">
        Earlier notes from {partnerName} ({notes.length})
      </summary>
      <ul className="mt-1 flex flex-col gap-2">
        {notes.map((n) => (
          <li
            key={n.id}
            id={`note-${n.id}`}
            className="flex scroll-mt-20 flex-col gap-1 rounded-xl bg-linen px-4 py-3"
          >
            <p className="whitespace-pre-line">{n.message}</p>
            <p className="text-caption text-muted">
              {format(parseISO(n.deliverOn), "EEE d MMM yyyy")}
            </p>
            {canReply && <ReplyBox note={n} partnerName={partnerName} draft={replyDrafts[n.id]} />}
          </li>
        ))}
      </ul>
    </details>
  );
}

function SentNotes({ partnerName, notes }: { partnerName: string; notes: Note[] }) {
  const answered = notes.filter((n) => n.reply).length;
  return (
    <details className="group w-full">
      <summary className="flex min-h-11 cursor-pointer list-none items-center text-label font-medium text-accent-dark">
        Notes you sent ({notes.length}
        {answered > 0 && `, ${answered} answered`})
      </summary>
      <ul className="mt-1 flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n.id} className="flex flex-col gap-1 rounded-xl bg-linen px-4 py-3">
            <p className="whitespace-pre-line">{n.message}</p>
            <p className="text-caption text-muted">
              {format(parseISO(n.deliverOn), "EEE d MMM yyyy")}
            </p>
            {n.reply ? (
              <div className="mt-1 rounded-xl bg-ivory px-4 py-3">
                <p className="text-caption font-medium text-muted">{partnerName} replied</p>
                <p className="whitespace-pre-line">{n.reply}</p>
              </div>
            ) : (
              <p className="text-caption text-muted">No reply yet.</p>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function NoteComposer({
  partnerName,
  today,
  tomorrow,
  scheduled,
  resume,
}: {
  partnerName: string;
  today: string;
  tomorrow: string;
  scheduled: Note[];
  /** A saved draft to reopen straight away. */
  resume?: NoteDraft | null;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(Boolean(resume));
  const [message, setMessage] = useState(resume?.message ?? "");
  const [deliverOn, setDeliverOn] = useState(
    resume?.deliverOn && resume.deliverOn >= today ? resume.deliverOn : tomorrow,
  );
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();
  const [pending, startTransition] = useTransition();
  // Each new note gets its own draft id when the composer opens.
  const [draftId, setDraftId] = useState<string | null>(resume?.id ?? null);
  const autosave = useDraft({
    kind: "note",
    id: draftId,
    payload: { message, deliverOn },
    enabled: open && draftId !== null,
  });

  function openComposer() {
    setSent(undefined);
    if (!draftId) setDraftId(crypto.randomUUID());
    setOpen(true);
  }

  /** Closing keeps what you wrote as a draft, like Gmail. */
  function close() {
    void autosave.flush();
    setOpen(false);
  }

  function discard() {
    startTransition(async () => {
      await autosave.pause();
      await autosave.discard();
      setMessage("");
      setDeliverOn(tomorrow);
      setDraftId(null);
      setOpen(false);
      autosave.resume();
    });
  }

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  // Next keeps hidden routes mounted; don't come back to an open dialog.
  useLayoutEffect(() => () => setOpen(false), []);

  function save() {
    setError(undefined);
    startTransition(async () => {
      await autosave.pause();
      const res = await saveNote({ message, deliverOn });
      if (res.error) {
        setError(res.error);
        autosave.resume();
        return;
      }
      await autosave.discard();
      // The composer stays open: anything written next is a fresh draft.
      setDraftId(crypto.randomUUID());
      autosave.resume();
      setSent(
        deliverOn === today
          ? `Sent. ${partnerName} will see it today.`
          : `Saved. ${partnerName} will see it on ${format(parseISO(deliverOn), "EEEE d MMMM")}.`,
      );
      setMessage("");
      setDeliverOn(tomorrow);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteNote(id);
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openComposer}>
        <PenLine aria-hidden className="size-4.5" strokeWidth={1.8} />
        {message.trim() ? "Continue your note (draft)" : `Leave a note for ${partnerName}`}
        {scheduled.length > 0 && <span className="text-muted">({scheduled.length} waiting)</span>}
      </Button>

      <dialog
        ref={ref}
        aria-labelledby="note-title"
        onClose={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="mx-0 mt-auto mb-0 max-h-[92dvh] w-full max-w-full rounded-t-[20px] bg-ivory px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] text-ink md:m-auto md:max-w-130 md:rounded-2xl md:p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="note-title" className="text-card">
            A note for {partnerName}
          </h2>
          <button
            type="button"
            aria-label="Close and keep as a draft"
            onClick={close}
            className="flex size-11 items-center justify-center rounded-xl hover:bg-linen"
          >
            <X aria-hidden className="size-5" strokeWidth={1.8} />
          </button>
        </div>
        <p className="mb-4 text-caption text-muted">
          It appears at the top of {partnerName}&rsquo;s dashboard on the morning you choose, and
          not before.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-4"
        >
          <Field id="note-message" label="Your note" error={error}>
            <Textarea
              id="note-message"
              rows={5}
              maxLength={1000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSent(undefined);
              }}
              placeholder={`Good morning, ${partnerName}…`}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy("note-message", { error })}
              className="font-serif text-quote"
            />
          </Field>
          <Field id="note-date" label="Show it on">
            <Input
              id="note-date"
              type="date"
              min={today}
              value={deliverOn}
              onChange={(e) => setDeliverOn(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" pending={pending} disabled={!message.trim()}>
              Save note
            </Button>
            {message.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={discard}
                disabled={pending}
                className="text-danger-text hover:text-danger-text"
              >
                Discard
              </Button>
            )}
            {sent ? (
              <span aria-live="polite" className="text-caption text-muted">
                {sent}
              </span>
            ) : (
              <DraftStatus status={autosave.status} error={autosave.error} />
            )}
          </div>
        </form>

        {scheduled.length > 0 && (
          <section className="mt-6 flex flex-col gap-2 border-t border-sand pt-4">
            <h3 className="text-quote">Waiting for {partnerName}</h3>
            <ul className="flex flex-col gap-2">
              {scheduled.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-2 rounded-xl bg-linen py-2 pr-1 pl-4"
                >
                  <div className="min-w-0 flex-1 py-1">
                    <p className="line-clamp-2 whitespace-pre-line">{n.message}</p>
                    <p className="text-caption text-muted">
                      {n.deliverOn === today
                        ? "Today"
                        : format(parseISO(n.deliverOn), "EEE d MMM yyyy")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete this note"
                    disabled={pending}
                    onClick={() => remove(n.id)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger-text disabled:opacity-50"
                  >
                    <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </dialog>
    </>
  );
}
