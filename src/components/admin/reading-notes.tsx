"use client";

import { NotebookPen, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addBookNote, deleteBookNote, updateBookNote } from "@/app/admin/books/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Textarea } from "@/components/ui/input";
import { TIME_ZONE } from "@/lib/constants";
import type { BookNote } from "@/lib/queries/books";

/** "15 Oct 2026, 09:12" in the diary's time zone (same on server and client). */
const stamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type ReadingNotesProps = { bookId: string; notes: BookNote[]; meId: string };

/** Private notes on a book, between the two of us: where we are, what struck us. */
export function ReadingNotes({ bookId, notes, meId }: ReadingNotesProps) {
  const router = useRouter();
  const [chapter, setChapter] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function post() {
    if (!body.trim()) return;
    setError(undefined);
    startTransition(async () => {
      const res = await addBookNote(bookId, { chapter, body });
      if (res.error) setError(res.error);
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <section
      aria-labelledby="notes-title"
      className="flex flex-col gap-4 border-t border-sand pt-8"
    >
      <h2 id="notes-title" className="flex items-center gap-2 text-section">
        <NotebookPen aria-hidden className="size-6 text-accent" strokeWidth={1.6} />
        Reading notes
        {notes.length > 0 && (
          <span className="font-sans text-label font-normal text-muted">({notes.length})</span>
        )}
      </h2>
      <p className="-mt-2 text-caption text-muted">
        Only the two of you can see these, even when the book is public.
      </p>

      {notes.length === 0 && (
        <p className="text-ink-soft">No notes yet. What stood out in today&rsquo;s chapter?</p>
      )}
      <ul className="flex flex-col gap-3">
        {notes.map((n) => (
          <NoteItem key={n.id} note={n} mine={n.authorId === meId} />
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          post();
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="note-chapter" className="sr-only">
          Chapter (optional)
        </label>
        <Input
          id="note-chapter"
          maxLength={80}
          value={chapter}
          placeholder="Chapter or page (optional)"
          onChange={(e) => setChapter(e.target.value)}
        />
        <label htmlFor="note-body" className="sr-only">
          Your note
        </label>
        <Textarea
          id="note-body"
          rows={3}
          maxLength={2000}
          value={body}
          placeholder="A thought, a question to talk about, a line that stayed with you…"
          onChange={(e) => {
            setBody(e.target.value);
            setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              post();
            }
          }}
        />
        {error && (
          <p role="alert" className="text-caption text-danger-text">
            {error}
          </p>
        )}
        <Button
          type="submit"
          size="sm"
          pending={pending}
          disabled={!body.trim()}
          className="self-end"
        >
          Add note
        </Button>
      </form>
    </section>
  );
}

function NoteItem({ note, mine }: { note: BookNote; mine: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [chapter, setChapter] = useState(note.chapter ?? "");
  const [body, setBody] = useState(note.body);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function save() {
    setError(undefined);
    startTransition(async () => {
      const res = await updateBookNote(note.id, { chapter, body });
      if (res.error) setError(res.error);
      else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <li className="flex gap-3">
      <Avatar
        name={note.authorName || "?"}
        image={note.authorAvatar}
        size="sm"
        tone={mine ? "a" : "b"}
        className="mt-1"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl bg-linen px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{note.authorName}</span>
          <time dateTime={note.createdAt} className="text-caption text-muted">
            {stamp.format(new Date(note.createdAt))}
            {note.edited && " · edited"}
          </time>
        </div>

        {editing ? (
          <div className="flex flex-col gap-2 pt-1">
            <label htmlFor={`chapter-${note.id}`} className="sr-only">
              Chapter (optional)
            </label>
            <Input
              id={`chapter-${note.id}`}
              maxLength={80}
              value={chapter}
              placeholder="Chapter or page (optional)"
              onChange={(e) => setChapter(e.target.value)}
              className="bg-ivory"
            />
            <label htmlFor={`edit-${note.id}`} className="sr-only">
              Edit your note
            </label>
            <Textarea
              id={`edit-${note.id}`}
              rows={3}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-ivory"
            />
            {error && <p className="text-caption text-danger-text">{error}</p>}
            <div className="flex gap-2 self-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setChapter(note.chapter ?? "");
                  setBody(note.body);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" pending={pending} disabled={!body.trim()} onClick={save}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            {note.chapter && (
              <p className="text-caption font-medium text-accent-dark">{note.chapter}</p>
            )}
            <p className="break-words whitespace-pre-line">{note.body}</p>
          </>
        )}

        {mine && !editing && (
          <div className="-mb-1 flex gap-1 self-end">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-caption font-medium text-muted hover:text-ink"
            >
              <Pencil aria-hidden className="size-3.5" strokeWidth={1.8} />
              Edit
            </button>
            <ConfirmDialog
              title="Delete this note?"
              description="It will be removed for both of you."
              onConfirm={async () => {
                const res = await deleteBookNote(note.id);
                if (res.error) setError(res.error);
                router.refresh();
              }}
              trigger={(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-caption font-medium text-muted hover:text-danger-text"
                >
                  <Trash2 aria-hidden className="size-3.5" strokeWidth={1.8} />
                  Delete
                </button>
              )}
            />
          </div>
        )}
        {!editing && error && <p className="text-caption text-danger-text">{error}</p>}
      </div>
    </li>
  );
}
