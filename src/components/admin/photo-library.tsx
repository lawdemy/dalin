"use client";

import { CircleAlert, Globe, ImagePlus, Lock, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { deletePhoto, setHeroPhoto, updatePhoto } from "@/app/admin/photos/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CloudImage } from "@/components/ui/cloud-image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import type { LibraryPhoto } from "@/lib/queries/photos";
import { cn } from "@/lib/utils";
import { UploadError, uploadPhoto } from "./upload-photo";

const FILTERS = {
  All: () => true,
  "In gallery": (p: LibraryPhoto) => p.inGallery,
  "On About page": (p: LibraryPhoto) => p.onAbout,
  "In public entries": (p: LibraryPhoto) => p.entry?.visibility === "public",
  Private: (p: LibraryPhoto, momentsEnabled: boolean) => !publicReasons(p, momentsEnabled).length,
} as const;
type Filter = keyof typeof FILTERS;

/** Why a photo is public, mirroring photo_is_public() in the database. */
function publicReasons(p: LibraryPhoto, momentsEnabled: boolean) {
  const reasons: string[] = [];
  if (p.isHero) reasons.push("home hero");
  if (p.inGallery) reasons.push("gallery");
  if (p.onAbout) reasons.push("About page");
  if (p.entry?.visibility === "public" && momentsEnabled) reasons.push("a public entry");
  return reasons;
}

type Upload = { key: string; name: string; progress: number; error?: string };

export function PhotoLibrary({
  photos,
  momentsEnabled,
}: {
  photos: LibraryPhoto[];
  momentsEnabled: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const shown = photos.filter((p) => FILTERS[filter](p, momentsEnabled));
  const open = photos.find((p) => p.id === openId) ?? null;

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const queued = Array.from(files).map((file) => ({ file, key: crypto.randomUUID() }));
    setUploads((u) => [
      ...u,
      ...queued.map(({ file, key }) => ({ key, name: file.name, progress: 0 })),
    ]);
    const set = (key: string, patch: Partial<Upload>) =>
      setUploads((u) => u.map((it) => (it.key === key ? { ...it, ...patch } : it)));

    let next = 0;
    const worker = async () => {
      while (next < queued.length) {
        const { file, key } = queued[next++];
        try {
          await uploadPhoto(file, (progress) => set(key, { progress }));
          setUploads((u) => u.filter((it) => it.key !== key));
          router.refresh();
        } catch (e) {
          set(key, {
            error: e instanceof UploadError ? e.message : `${file.name} couldn't be uploaded.`,
          });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(2, queued.length) }, worker));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-title">Photos</h1>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
          <ImagePlus aria-hidden className="size-4.5" strokeWidth={1.8} />
          Upload
        </Button>
      </div>

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.key} className="flex items-center gap-3 rounded-xl bg-linen px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-caption">{u.name}</span>
              {u.error ? (
                <>
                  <span className="flex items-center gap-1 text-caption text-danger-text">
                    <CircleAlert aria-hidden className="size-3.5" strokeWidth={2} />
                    {u.error}
                  </span>
                  <button
                    type="button"
                    aria-label={`Dismiss ${u.name}`}
                    onClick={() => setUploads((all) => all.filter((it) => it.key !== u.key))}
                    className="flex size-11 items-center justify-center rounded-lg text-muted"
                  >
                    <X aria-hidden className="size-4.5" strokeWidth={1.8} />
                  </button>
                </>
              ) : (
                <div
                  role="progressbar"
                  aria-label={`Uploading ${u.name}`}
                  aria-valuenow={u.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1 w-24 overflow-hidden rounded-full bg-divider"
                >
                  <div className="h-1 bg-accent" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div role="group" aria-label="Filter photos" className="flex flex-wrap gap-2">
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <Chip key={f} selected={f === filter} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>
      <p className="text-caption text-muted">
        {shown.length} {shown.length === 1 ? "photo" : "photos"}
      </p>

      {shown.length === 0 ? (
        <EmptyState
          title={photos.length ? "No photos here" : "No photos yet"}
          description={
            photos.length ? "Try another filter." : "Upload photos here, or add them to an entry."
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-1.5 md:grid-cols-5 md:gap-2">
          {shown.map((p) => {
            const isPublic = publicReasons(p, momentsEnabled).length > 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpenId(p.id)}
                aria-label={`Photo from ${p.entry?.title ?? "an unsorted upload"}, ${isPublic ? "public" : "private"}${p.isHero ? ", home hero" : ""}`}
                className="relative aspect-square overflow-hidden rounded-[10px] bg-tone-3"
              >
                <CloudImage
                  sources={p.sources}
                  blurDataUrl={p.blurDataUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 20vw, 33vw"
                  className="object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                  {p.isHero && (
                    <span className="flex h-5.5 items-center rounded-full bg-ink px-1.75 text-[0.6875rem] font-semibold text-ivory">
                      Hero
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex size-5.5 items-center justify-center rounded-full",
                      isPublic ? "bg-rose-tint text-danger-text" : "bg-private-tint text-ink-soft",
                    )}
                  >
                    {isPublic ? (
                      <Globe aria-hidden className="size-3" strokeWidth={2} />
                    ) : (
                      <Lock aria-hidden className="size-3" strokeWidth={2} />
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <PhotoSheet
        photo={open}
        momentsEnabled={momentsEnabled}
        onClose={() => setOpenId(null)}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}

type PhotoSheetProps = {
  photo: LibraryPhoto | null;
  momentsEnabled: boolean;
  onClose: () => void;
  onChanged: () => void;
};

/** Bottom sheet on phones, centred dialog on desktop. Stays mounted. */
function PhotoSheet({ photo, momentsEnabled, onClose, onChanged }: PhotoSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (photo && !dialog.open) dialog.showModal();
    if (!photo && dialog.open) dialog.close();
  }, [photo]);

  // Next keeps hidden routes mounted; don't come back to an open sheet.
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });
  useLayoutEffect(() => () => onCloseRef.current(), []);

  return (
    <dialog
      ref={ref}
      aria-label="Photo details"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // tap on the backdrop
      }}
      className="mx-0 mt-auto mb-0 max-h-[92dvh] w-full max-w-full rounded-t-[20px] bg-ivory px-5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))] text-ink md:m-auto md:max-w-120 md:rounded-2xl md:p-6"
    >
      <div aria-hidden className="mx-auto mt-1 mb-4 h-1 w-10 rounded-full bg-sand md:hidden" />
      {photo && (
        <PhotoDetails
          key={photo.id}
          photo={photo}
          momentsEnabled={momentsEnabled}
          onClose={onClose}
          onChanged={onChanged}
        />
      )}
    </dialog>
  );
}

/** The sheet's contents; remounts per photo so its fields start fresh. */
function PhotoDetails({
  photo,
  momentsEnabled,
  onClose,
  onChanged,
}: PhotoSheetProps & { photo: LibraryPhoto }) {
  const [inGallery, setInGallery] = useState(photo.inGallery);
  const [onAbout, setOnAbout] = useState(photo.onAbout);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const preview = { ...photo, inGallery, onAbout };
  const reasons = publicReasons(preview, momentsEnabled);
  const status = reasons.length
    ? `Public: shown on ${reasons.join(", ")}`
    : photo.entry?.visibility === "public" && !momentsEnabled
      ? "Private: its entry is public, but Moments is switched off"
      : "Private: only the two of us";

  function run(action: () => Promise<{ error?: string }>, undo?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        setError(res.error);
        undo?.();
      }
      onChanged();
    });
  }

  function save(
    next: { inGallery: boolean; onAbout: boolean; caption: string },
    undo?: () => void,
  ) {
    run(() => updatePhoto({ id: photo.id, ...next }), undo);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-tone-3">
          <CloudImage
            sources={photo.sources}
            blurDataUrl={photo.blurDataUrl}
            alt={photo.alt}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          {photo.entry ? (
            <Link href={`/admin/entries/${photo.entry.id}`} className="font-medium">
              {photo.entry.title}
            </Link>
          ) : (
            <span className="font-medium">Unsorted upload</span>
          )}
          <span className={cn("text-caption", reasons.length ? "text-danger-text" : "text-muted")}>
            {status}
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-tint px-3 py-2 text-label text-danger-text">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="photo-caption" className="text-label font-medium">
          Caption <span className="font-normal text-muted">(also used as alt text)</span>
        </label>
        <input
          id="photo-caption"
          value={caption}
          maxLength={300}
          placeholder="Describe this photo"
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            if (caption.trim() !== (photo.caption ?? "")) save({ inGallery, onAbout, caption });
          }}
          className="h-12 rounded-xl border border-line bg-linen px-3.5 text-ink"
        />
      </div>

      <div className="flex flex-col">
        <Switch
          label="In public gallery"
          checked={inGallery}
          disabled={pending}
          onCheckedChange={(v) => {
            setInGallery(v);
            save({ inGallery: v, onAbout, caption }, () => setInGallery(!v));
          }}
        />
        <Switch
          label="On About page"
          checked={onAbout}
          disabled={pending}
          onCheckedChange={(v) => {
            setOnAbout(v);
            save({ inGallery, onAbout: v, caption }, () => setOnAbout(!v));
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={photo.isHero ? "secondary" : "primary"}
          size="sm"
          pending={pending}
          onClick={() => run(() => setHeroPhoto(photo.isHero ? null : photo.id))}
        >
          {photo.isHero ? "Remove as home hero" : "Set as home hero"}
        </Button>
        <ConfirmDialog
          title="Delete this photo?"
          description={
            photo.entry
              ? `It will be removed from “${photo.entry.title}” and deleted for good.`
              : "It will be deleted for good."
          }
          onConfirm={async () => {
            const res = await deletePhoto(photo.id);
            if (res.error) setError(res.error);
            else {
              onClose();
              onChanged();
            }
          }}
          trigger={(openConfirm) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={openConfirm}
              className="text-danger-text hover:text-danger-text"
            >
              <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
              Delete photo
            </Button>
          )}
        />
        <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
          Done
        </Button>
      </div>
    </div>
  );
}
