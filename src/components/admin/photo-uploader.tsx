"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircleAlert, GripVertical, ImagePlus, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRef, type Dispatch, type SetStateAction } from "react";
import { discardPhoto } from "@/app/admin/entries/actions";
import { CloudImage } from "@/components/ui/cloud-image";
import type { Photo } from "@/lib/images";
import { cn } from "@/lib/utils";
import { UploadError, uploadPhoto } from "./upload-photo";

export type PhotoItem =
  | { key: string; status: "uploading"; name: string; previewUrl: string; progress: number }
  | { key: string; status: "error"; name: string; previewUrl: string; message: string }
  | { key: string; status: "ready"; photo: Photo; caption: string };

type PhotoUploaderProps = {
  items: PhotoItem[];
  setItems: Dispatch<SetStateAction<PhotoItem[]>>;
  coverId: string | null;
  onCoverChange: (id: string) => void;
  error?: string;
};

const CONCURRENCY = 2;

export function PhotoUploader({
  items,
  setItems,
  coverId,
  onCoverChange,
  error,
}: PhotoUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(key: string, next: (item: PhotoItem) => PhotoItem) {
    setItems((all) => all.map((it) => (it.key === key ? next(it) : it)));
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const queued = Array.from(files).map((file) => ({
      file,
      key: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
    }));
    setItems((all) => [
      ...all,
      ...queued.map(({ key, file, previewUrl }) => ({
        key,
        status: "uploading" as const,
        name: file.name,
        previewUrl,
        progress: 0,
      })),
    ]);

    // A couple at a time: quick on wifi, gentle on mobile data.
    let next = 0;
    const worker = async () => {
      while (next < queued.length) {
        const { file, key, previewUrl } = queued[next++];
        try {
          const photo = await uploadPhoto(file, (progress) =>
            update(key, (it) => (it.status === "uploading" ? { ...it, progress } : it)),
          );
          URL.revokeObjectURL(previewUrl);
          update(key, () => ({ key, status: "ready", photo, caption: "" }));
        } catch (e) {
          const message =
            e instanceof UploadError ? e.message : `${file.name} couldn't be uploaded. Try again.`;
          update(key, () => ({ key, status: "error", name: file.name, previewUrl, message }));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queued.length) }, worker));
  }

  function remove(item: PhotoItem) {
    setItems((all) => all.filter((it) => it.key !== item.key));
    if (item.status !== "ready") URL.revokeObjectURL(item.previewUrl);
    // Unsaved uploads are deleted now; photos already in the entry go on save.
    if (item.status === "ready") void discardPhoto(item.photo.id);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setItems((all) => {
      const from = all.findIndex((it) => it.key === active.id);
      const to = all.findIndex((it) => it.key === over.id);
      return arrayMove(all, from, to);
    });
  }

  return (
    <section aria-labelledby="photos-label" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span id="photos-label" className="text-label font-medium">
          Photos
        </span>
        <span className="text-micro text-muted">Location data is removed on upload</span>
      </div>

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
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex h-22 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-stitch bg-linen font-medium text-ink-soft hover:bg-sand/50"
      >
        <ImagePlus aria-hidden className="size-6 text-accent" strokeWidth={1.6} />
        Add photos
      </button>
      {error && <p className="text-caption text-danger-text">{error}</p>}

      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((it) => it.key)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col">
              {items.map((item, i) => (
                <PhotoRow
                  key={item.key}
                  item={item}
                  index={i}
                  isCover={item.status === "ready" && item.photo.id === coverId}
                  onCaption={(caption) =>
                    update(item.key, (it) => (it.status === "ready" ? { ...it, caption } : it))
                  }
                  onCover={() => item.status === "ready" && onCoverChange(item.photo.id)}
                  onRemove={() => remove(item)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

type PhotoRowProps = {
  item: PhotoItem;
  index: number;
  isCover: boolean;
  onCaption: (caption: string) => void;
  onCover: () => void;
  onRemove: () => void;
};

function PhotoRow({ item, index, isCover, onCaption, onCover, onRemove }: PhotoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });
  const n = index + 1;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 border-b border-divider bg-ivory py-2",
        isDragging && "relative z-10 rounded-xl shadow-menu",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag to reorder photo ${n}`}
        className="flex h-11 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-disabled"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden className="size-5" strokeWidth={1.8} />
      </button>

      <div className="relative size-15 shrink-0 overflow-hidden rounded-lg bg-tone-2">
        {item.status === "ready" ? (
          <CloudImage
            sources={item.photo.sources}
            blurDataUrl={item.photo.blurDataUrl}
            alt=""
            fill
            sizes="60px"
            className="object-cover"
          />
        ) : (
          <Image
            src={item.previewUrl}
            alt=""
            fill
            unoptimized
            sizes="60px"
            className="object-cover"
          />
        )}
        {item.status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/45 text-micro font-semibold text-white">
            {item.progress}%
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {item.status === "ready" ? (
          <input
            aria-label={`Caption for photo ${n}`}
            placeholder="Add a caption"
            value={item.caption}
            maxLength={300}
            onChange={(e) => onCaption(e.target.value)}
            className="h-10 min-w-0 rounded-lg border border-sand bg-ivory px-2.5 text-label text-ink"
          />
        ) : item.status === "uploading" ? (
          <>
            <span className="truncate text-caption text-muted">{item.name}</span>
            <div
              role="progressbar"
              aria-label={`Uploading photo ${n}`}
              aria-valuenow={item.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1 overflow-hidden rounded-full bg-divider"
            >
              <div
                className="h-1 bg-accent transition-[width]"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </>
        ) : (
          <span className="flex items-start gap-1.5 text-caption text-danger-text">
            <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
            {item.message}
          </span>
        )}
      </div>

      {item.status === "ready" && (
        <button
          type="button"
          aria-label={isCover ? "Cover photo" : `Set photo ${n} as cover`}
          aria-pressed={isCover}
          onClick={onCover}
          className={cn(
            "flex h-11 w-10 shrink-0 items-center justify-center rounded-lg",
            isCover ? "text-accent" : "text-disabled hover:text-ink",
          )}
        >
          <Star
            aria-hidden
            className="size-5"
            strokeWidth={1.8}
            fill={isCover ? "currentColor" : "none"}
          />
        </button>
      )}
      <button
        type="button"
        aria-label={item.status === "error" ? `Dismiss photo ${n}` : `Remove photo ${n}`}
        onClick={onRemove}
        disabled={item.status === "uploading"}
        className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger-text disabled:opacity-40"
      >
        {item.status === "error" ? (
          <X aria-hidden className="size-5" strokeWidth={1.8} />
        ) : (
          <Trash2 aria-hidden className="size-5" strokeWidth={1.8} />
        )}
      </button>
    </li>
  );
}
