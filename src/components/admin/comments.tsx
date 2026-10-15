"use client";

import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addComment, deleteComment, updateComment } from "@/app/admin/comments/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/input";
import { TIME_ZONE } from "@/lib/constants";
import type { Comment } from "@/lib/queries/comments";

/** "15 Oct 2026, 09:12" in the diary's time zone (same on server and client). */
const stamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type CommentsProps = {
  entryId: string;
  comments: Comment[];
  meId: string;
  setupNeeded?: boolean;
};

/** Private conversation under an entry, between the two of us. */
export function Comments({ entryId, comments, meId, setupNeeded }: CommentsProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function post() {
    if (!draft.trim()) return;
    setError(undefined);
    startTransition(async () => {
      const res = await addComment(entryId, draft);
      if (res.error) setError(res.error);
      else {
        setDraft("");
        router.refresh();
      }
    });
  }

  return (
    <section
      aria-labelledby="comments-title"
      className="flex flex-col gap-4 border-t border-sand pt-8"
    >
      <h2 id="comments-title" className="flex items-center gap-2 text-section">
        <MessageCircle aria-hidden className="size-6 text-accent" strokeWidth={1.6} />
        Comments
        {comments.length > 0 && (
          <span className="font-sans text-label font-normal text-muted">({comments.length})</span>
        )}
      </h2>
      <p className="-mt-2 text-caption text-muted">Only the two of you can see comments.</p>

      {setupNeeded ? (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          Comments switch on once migration 0007 has been run in Supabase.
        </p>
      ) : (
        <>
          {comments.length === 0 && (
            <p className="text-ink-soft">No comments yet. Say something sweet.</p>
          )}
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} mine={c.authorId === meId} />
            ))}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              post();
            }}
            className="flex flex-col gap-2"
          >
            <label htmlFor="new-comment" className="sr-only">
              Write a comment
            </label>
            <Textarea
              id="new-comment"
              rows={3}
              maxLength={2000}
              value={draft}
              placeholder="Write a comment…"
              onChange={(e) => {
                setDraft(e.target.value);
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
              disabled={!draft.trim()}
              className="self-end"
            >
              Post comment
            </Button>
          </form>
        </>
      )}
    </section>
  );
}

function CommentItem({ comment, mine }: { comment: Comment; mine: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function save() {
    setError(undefined);
    startTransition(async () => {
      const res = await updateComment(comment.id, text);
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
        name={comment.authorName || "?"}
        image={comment.authorAvatar}
        size="sm"
        tone={mine ? "a" : "b"}
        className="mt-1"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl bg-linen px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{comment.authorName}</span>
          <time dateTime={comment.createdAt} className="text-caption text-muted">
            {stamp.format(new Date(comment.createdAt))}
            {comment.edited && " · edited"}
          </time>
        </div>

        {editing ? (
          <div className="flex flex-col gap-2 pt-1">
            <label htmlFor={`edit-${comment.id}`} className="sr-only">
              Edit your comment
            </label>
            <Textarea
              id={`edit-${comment.id}`}
              rows={3}
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-ivory"
            />
            {error && <p className="text-caption text-danger-text">{error}</p>}
            <div className="flex gap-2 self-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setText(comment.body);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" pending={pending} disabled={!text.trim()} onClick={save}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="break-words whitespace-pre-line">{comment.body}</p>
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
              title="Delete this comment?"
              description="It will be removed for both of you."
              onConfirm={async () => {
                const res = await deleteComment(comment.id);
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
