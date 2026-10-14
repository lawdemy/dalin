"use client";

import { format, parseISO } from "date-fns";
import { Heart, PenLine, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { deleteNote, saveNote } from "@/app/admin/notes/actions";
import { Button } from "@/components/ui/button";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import type { DashboardNotes, Note } from "@/lib/queries/notes";

type NotesPanelProps = {
  notes: DashboardNotes;
  /** yyyy-mm-dd in the diary's time zone. */
  today: string;
  tomorrow: string;
};

/** Today's notes from your partner, plus writing and scheduling your own. */
export function NotesPanel({ notes, today, tomorrow }: NotesPanelProps) {
  const { partner } = notes;
  if (!partner) return null;
  return (
    <div className="flex flex-col gap-3">
      {notes.today.map((note) => (
        <figure
          key={note.id}
          className="flex flex-col gap-2 rounded-xl bg-rose-tint px-5 py-5 md:px-6"
        >
          <figcaption className="flex items-center gap-2 text-caption font-medium tracking-[1px] text-danger-text uppercase">
            <Heart aria-hidden className="size-4" strokeWidth={2} fill="currentColor" />A note from{" "}
            {partner.name}
          </figcaption>
          <blockquote className="font-serif text-quote leading-snug font-medium whitespace-pre-line">
            {note.message}
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
        />
        {notes.earlier.length > 0 && (
          <EarlierNotes partnerName={partner.name} notes={notes.earlier} />
        )}
      </div>
    </div>
  );
}

function EarlierNotes({ partnerName, notes }: { partnerName: string; notes: Note[] }) {
  return (
    <details className="group w-full">
      <summary className="flex min-h-11 cursor-pointer list-none items-center text-label font-medium text-accent-dark">
        Earlier notes from {partnerName} ({notes.length})
      </summary>
      <ul className="mt-1 flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n.id} className="rounded-xl bg-linen px-4 py-3">
            <p className="whitespace-pre-line">{n.message}</p>
            <p className="mt-1 text-caption text-muted">
              {format(parseISO(n.deliverOn), "EEE d MMM yyyy")}
            </p>
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
}: {
  partnerName: string;
  today: string;
  tomorrow: string;
  scheduled: Note[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [deliverOn, setDeliverOn] = useState(tomorrow);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();
  const [pending, startTransition] = useTransition();

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
      const res = await saveNote({ message, deliverOn });
      if (res.error) {
        setError(res.error);
        return;
      }
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
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setSent(undefined);
          setOpen(true);
        }}
      >
        <PenLine aria-hidden className="size-4.5" strokeWidth={1.8} />
        Leave a note for {partnerName}
        {scheduled.length > 0 && <span className="text-muted">({scheduled.length} waiting)</span>}
      </Button>

      <dialog
        ref={ref}
        aria-labelledby="note-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="mx-0 mt-auto mb-0 max-h-[92dvh] w-full max-w-full rounded-t-[20px] bg-ivory px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] text-ink md:m-auto md:max-w-130 md:rounded-2xl md:p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="note-title" className="text-card">
            A note for {partnerName}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
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
            <span aria-live="polite" className="text-caption text-muted">
              {sent}
            </span>
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
