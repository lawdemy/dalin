"use client";

import { CircleAlert, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteEntry, saveEntry, type SaveEntryResult } from "@/app/admin/entries/actions";
import { Editor } from "@/components/rich-text/editor";
import type { TiptapDoc } from "@/components/rich-text/rich-text";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Visibility } from "@/components/ui/visibility-badge";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import type { Category, Mood } from "@/lib/constants";
import type { Photo } from "@/lib/images";
import type { Entry } from "@/lib/queries/entries";
import { CategoryPicker } from "./category-picker";
import { DraftStatus } from "./draft-status";
import { MoodPicker } from "./mood-picker";
import { PhotoUploader, type PhotoItem } from "./photo-uploader";
import { useDraft } from "./use-draft";

/** What a new entry's draft holds when it is reopened. */
export type EntryDraftValues = {
  title: string;
  entryDate: string;
  location: string;
  mood: Mood | null;
  category: Category;
  body: TiptapDoc | null;
  visibility: Visibility;
  photos: { photo: Photo; caption: string }[];
  coverPhotoId: string | null;
};

type EntryFormProps = {
  /** The entry being edited; omit for a new one. */
  entry?: Entry;
  /** Today in the diary's time zone, yyyy-mm-dd (new entries). */
  today: string;
  /** New entries: the draft they autosave into, and its content when reopened. */
  draft?: { id: string; values?: EntryDraftValues };
};

export function EntryForm({ entry, today, draft }: EntryFormProps) {
  const router = useRouter();
  const start = draft?.values;
  const [title, setTitle] = useState(entry?.title ?? start?.title ?? "");
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? (start?.entryDate || today));
  const [location, setLocation] = useState(entry?.location ?? start?.location ?? "");
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? start?.mood ?? null);
  const [category, setCategory] = useState<Category>(
    entry?.category ?? start?.category ?? "everyday",
  );
  const [body, setBody] = useState<TiptapDoc | null>(entry?.body ?? start?.body ?? null);
  const [visibility, setVisibility] = useState<Visibility>(
    entry?.visibility ?? start?.visibility ?? "private",
  );
  const [items, setItems] = useState<PhotoItem[]>(
    () =>
      entry?.photos.map((photo) => ({
        key: photo.id,
        status: "ready" as const,
        photo,
        caption: photo.caption ?? "",
      })) ??
      start?.photos.map(({ photo, caption }) => ({
        key: photo.id,
        status: "ready" as const,
        photo,
        caption,
      })) ??
      [],
  );
  const [coverId, setCoverId] = useState<string | null>(
    entry?.coverPhotoId ?? start?.coverPhotoId ?? null,
  );
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SaveEntryResult>({});
  const [saving, startSaving] = useTransition();

  const uploading = items.some((it) => it.status === "uploading");
  const ready = items.filter((it) => it.status === "ready");
  const effectiveCover = ready.some((it) => it.photo.id === coverId)
    ? coverId
    : (ready[0]?.photo.id ?? null);

  // New entries save themselves as a draft while you write (see /admin/drafts).
  const drafting = !entry && Boolean(draft);
  const autosave = useDraft({
    kind: "entry",
    id: draft?.id,
    enabled: drafting,
    payload: {
      title,
      entryDate,
      location,
      mood,
      category,
      body,
      visibility,
      photos: ready.map((it) => ({ id: it.photo.id, caption: it.caption })),
      coverPhotoId: effectiveCover,
    },
  });

  // Mark the form changed whenever any field changes after the first render.
  const touch =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setDirty(true);
    };

  // Warn before leaving with unsaved changes. New entries keep everything in
  // their draft, so they only warn while a draft save is still in flight.
  const unsaved = drafting ? autosave.status === "saving" : dirty;
  useEffect(() => {
    if (!unsaved || saving) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved, saving]);

  function save() {
    setResult({});
    startSaving(async () => {
      // Stop autosaving so the draft isn't recreated once the entry is saved.
      if (drafting) await autosave.pause();
      const res = await saveEntry({
        draftId: drafting ? draft?.id : undefined,
        id: entry?.id,
        title,
        entryDate,
        location,
        mood,
        category,
        body,
        visibility,
        photos: ready.map((it) => ({ id: it.photo.id, caption: it.caption })),
        coverPhotoId: effectiveCover,
      });
      // On success the action redirects; anything returned is a problem.
      if (res) {
        if (drafting) autosave.resume();
        setResult(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const fe = result.fieldErrors ?? {};
  const closeHref = entry ? `/admin/entries/${entry.id}` : "/admin";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
      className="mx-auto flex w-full max-w-180 flex-col gap-6"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-section md:text-section-lg">{entry ? "Edit entry" : "New entry"}</h1>
          {drafting && <DraftStatus status={autosave.status} error={autosave.error} />}
        </div>
        <Link
          href={closeHref}
          aria-label={drafting ? "Close and keep as a draft" : "Close without saving"}
          onClick={(e) => {
            if (!drafting && dirty && !window.confirm("Leave without saving your changes?"))
              e.preventDefault();
          }}
          className="flex size-11 items-center justify-center rounded-xl text-ink hover:bg-linen hover:text-ink"
        >
          <X aria-hidden className="size-5.5" strokeWidth={1.8} />
        </Link>
      </div>

      {result.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-rose-tint px-4 py-3 text-label text-danger-text"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4.5 shrink-0" strokeWidth={1.8} />
          {result.error}
        </div>
      )}

      <Field id="title" label="Title" required error={fe.title}>
        <Input
          id="title"
          value={title}
          onChange={(e) => touch(setTitle)(e.target.value)}
          placeholder="Give the day a name"
          maxLength={140}
          required
          aria-invalid={fe.title ? true : undefined}
          aria-describedby={describedBy("title", { error: fe.title })}
          className="h-13 px-4 font-serif text-quote font-semibold"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="entry-date" label="Date" error={fe.entryDate}>
          <Input
            id="entry-date"
            type="date"
            value={entryDate}
            max="2100-12-31"
            onChange={(e) => touch(setEntryDate)(e.target.value)}
            aria-invalid={fe.entryDate ? true : undefined}
            aria-describedby={describedBy("entry-date", { error: fe.entryDate })}
            className="px-3"
          />
        </Field>
        <Field id="location" label="Location" error={fe.location}>
          <Input
            id="location"
            value={location}
            onChange={(e) => touch(setLocation)(e.target.value)}
            placeholder="Where were you?"
            maxLength={120}
            aria-invalid={fe.location ? true : undefined}
            aria-describedby={describedBy("location", { error: fe.location })}
            className="px-3"
          />
        </Field>
      </div>

      <MoodPicker value={mood} onChange={touch(setMood)} />
      <CategoryPicker value={category} onChange={touch(setCategory)} />

      <PhotoUploader
        items={items}
        setItems={(next) => {
          setItems(next);
          setDirty(true);
        }}
        coverId={effectiveCover}
        onCoverChange={touch(setCoverId)}
        error={fe.photos}
      />

      <div className="flex flex-col gap-1.5">
        <span id="body-label" className="text-label font-medium">
          What happened?
        </span>
        <Editor id="body" labelledBy="body-label" initialContent={body} onChange={touch(setBody)} />
      </div>

      <VisibilityToggle value={visibility} onChange={touch(setVisibility)} />

      {drafting && (
        <ConfirmDialog
          title="Discard this draft?"
          description="Everything you've written here and any photos you added will be deleted."
          confirmLabel="Discard draft"
          cancelLabel="Keep writing"
          onConfirm={async () => {
            await autosave.pause();
            await autosave.discard();
            router.push("/admin");
          }}
          trigger={(open) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={open}
              className="self-start px-1 text-danger-text hover:text-danger-text"
            >
              <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
              Discard draft
            </Button>
          )}
        />
      )}

      {entry && (
        <ConfirmDialog
          title="Delete this entry?"
          description={
            <>
              “{entry.title}”
              {entry.photos.length > 0 &&
                ` and its ${entry.photos.length} photo${entry.photos.length === 1 ? "" : "s"}`}{" "}
              will be deleted for good, along with all its comments.
            </>
          }
          onConfirm={async () => {
            setDirty(false);
            await deleteEntry(entry.id);
          }}
          trigger={(open) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={open}
              className="self-start px-1 text-danger-text hover:text-danger-text"
            >
              <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
              Delete entry
            </Button>
          )}
        />
      )}

      {/* Sticky save bar; the tab bar is hidden on editor pages. */}
      <div className="sticky bottom-0 z-20 -mx-5 border-t border-sand bg-ivory px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] md:-mx-6 md:px-6">
        <div className="mx-auto max-w-180">
          <Button type="submit" size="lg" fullWidth pending={saving} disabled={uploading}>
            {uploading
              ? "Waiting for photos…"
              : saving
                ? "Saving…"
                : visibility === "public"
                  ? "Save and share publicly"
                  : "Save entry"}
          </Button>
        </div>
      </div>
    </form>
  );
}
