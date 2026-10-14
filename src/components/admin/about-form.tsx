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
import { Check, CircleAlert, GripVertical, Heart, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { reorderAboutPhotos, saveAbout, type SaveAboutResult } from "@/app/admin/about/actions";
import { setHeroPhoto, updatePhoto } from "@/app/admin/photos/actions";
import { Editor } from "@/components/rich-text/editor";
import type { TiptapDoc } from "@/components/rich-text/rich-text";
import { Button } from "@/components/ui/button";
import { CloudImage } from "@/components/ui/cloud-image";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import type { LibraryPhoto } from "@/lib/queries/photos";
import type { AboutSettings } from "@/lib/queries/settings";
import { cn } from "@/lib/utils";

type AboutFormProps = { settings: AboutSettings; photos: LibraryPhoto[] };

export function AboutForm({ settings, photos }: AboutFormProps) {
  const [coupleNames, setCoupleNames] = useState(settings.coupleNames);
  const [welcomeLine, setWelcomeLine] = useState(settings.welcomeLine);
  const [ourStory, setOurStory] = useState<TiptapDoc | null>(settings.ourStory);
  const [howWeMet, setHowWeMet] = useState<TiptapDoc | null>(settings.howWeMet);
  const [engagementStory, setEngagementStory] = useState<TiptapDoc | null>(
    settings.engagementStory,
  );
  const [engagementDate, setEngagementDate] = useState(settings.engagementDate ?? "");
  const [engagementPlace, setEngagementPlace] = useState(settings.engagementPlace ?? "");
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SaveAboutResult>({});
  const [saving, startSaving] = useTransition();

  const touch =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setDirty(true);
      setResult({});
    };

  useEffect(() => {
    if (!dirty || saving) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  function save() {
    startSaving(async () => {
      const res = await saveAbout({
        coupleNames,
        welcomeLine,
        ourStory,
        howWeMet,
        engagementStory,
        engagementDate: engagementDate || null,
        engagementPlace,
      });
      setResult(res);
      if (res.ok) setDirty(false);
    });
  }

  const fe = result.fieldErrors ?? {};

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
      className="mx-auto flex w-full max-w-180 flex-col gap-8 pb-28"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-title">About Us editor</h1>
        <p className="text-caption text-muted">
          What visitors see on the home page and{" "}
          <Link href="/about" target="_blank">
            the About page
          </Link>
          .
        </p>
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

      <Section title="Home page">
        <Field id="couple-names" label="Your names" required error={fe.coupleNames}>
          <Input
            id="couple-names"
            value={coupleNames}
            onChange={(e) => touch(setCoupleNames)(e.target.value)}
            placeholder="Daniel & Linda"
            maxLength={80}
            aria-invalid={fe.coupleNames ? true : undefined}
            aria-describedby={describedBy("couple-names", { error: fe.coupleNames })}
            className="font-serif text-quote font-semibold"
          />
        </Field>
        <Field
          id="welcome-line"
          label="Welcome line"
          hint="A sentence or two under your names."
          error={fe.welcomeLine}
        >
          <Textarea
            id="welcome-line"
            rows={2}
            value={welcomeLine}
            onChange={(e) => touch(setWelcomeLine)(e.target.value)}
            maxLength={200}
            aria-invalid={fe.welcomeLine ? true : undefined}
            aria-describedby={describedBy("welcome-line", { hint: true, error: fe.welcomeLine })}
          />
        </Field>
        <HeroPicker photos={photos} />
      </Section>

      <Section title="Our story">
        <StoryEditor
          id="our-story"
          label="Introduction"
          doc={ourStory}
          onChange={touch(setOurStory)}
        />
        <StoryEditor
          id="how-we-met"
          label="How we met"
          doc={howWeMet}
          onChange={touch(setHowWeMet)}
        />
      </Section>

      <Section title="The proposal">
        <div className="grid grid-cols-2 gap-3">
          <Field id="engagement-date" label="Engagement date">
            <Input
              id="engagement-date"
              type="date"
              value={engagementDate}
              onChange={(e) => touch(setEngagementDate)(e.target.value)}
              className="px-3"
            />
          </Field>
          <Field id="engagement-place" label="Where" error={fe.engagementPlace}>
            <Input
              id="engagement-place"
              value={engagementPlace}
              onChange={(e) => touch(setEngagementPlace)(e.target.value)}
              placeholder="e.g. Tarkwa Bay"
              maxLength={120}
              aria-invalid={fe.engagementPlace ? true : undefined}
              aria-describedby={describedBy("engagement-place", { error: fe.engagementPlace })}
              className="px-3"
            />
          </Field>
        </div>
        <StoryEditor
          id="engagement-story"
          label="The story"
          doc={engagementStory}
          onChange={touch(setEngagementStory)}
        />
      </Section>

      <AboutPhotos photos={photos} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sand bg-ivory px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] md:sticky md:-mx-6 md:px-6">
        <div className="mx-auto flex max-w-180 flex-col gap-2">
          <p aria-live="polite" className="text-center text-caption text-muted empty:hidden">
            {result.ok ? "Saved. The public site updates within a few seconds." : ""}
          </p>
          <Button type="submit" size="lg" fullWidth pending={saving} disabled={!dirty && !saving}>
            {saving ? "Saving…" : dirty ? "Save changes" : result.ok ? "Saved" : "No changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section">{title}</h2>
      {children}
    </section>
  );
}

function StoryEditor({
  id,
  label,
  doc,
  onChange,
}: {
  id: string;
  label: string;
  doc: TiptapDoc | null;
  onChange: (doc: TiptapDoc) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-label font-medium">
        {label}
      </span>
      <Editor
        id={id}
        labelledBy={`${id}-label`}
        initialContent={doc}
        onChange={onChange}
        placeholder="Tell your story…"
      />
    </div>
  );
}

// Hero ----------------------------------------------------------------------------------

function HeroPicker({ photos }: { photos: LibraryPhoto[] }) {
  const router = useRouter();
  const hero = photos.find((p) => p.isHero) ?? null;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useLayoutEffect(() => () => setOpen(false), []);

  function choose(id: string | null) {
    setError(undefined);
    startTransition(async () => {
      const res = await setHeroPhoto(id);
      if (res.error) setError(res.error);
      else setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label font-medium">Hero photo</span>
      <div className="flex items-center gap-4 rounded-xl bg-linen p-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-tone-1">
          {hero ? (
            <CloudImage sources={hero.sources} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Heart aria-hidden className="size-5 text-accent" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={!photos.length}
          >
            {hero ? "Change" : "Choose photo"}
          </Button>
          {hero && (
            <Button variant="ghost" size="sm" onClick={() => choose(null)} pending={pending}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {!photos.length && (
        <p className="text-caption text-muted">
          Upload photos under <Link href="/admin/photos">Photos</Link> first.
        </p>
      )}
      {error && <p className="text-caption text-danger-text">{error}</p>}

      <dialog
        ref={ref}
        aria-label="Choose the hero photo"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-full rounded-t-[20px] bg-ivory p-4 pb-[calc(16px+env(safe-area-inset-bottom))] text-ink md:m-auto md:max-w-180 md:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-card">Choose the hero photo</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="flex size-11 items-center justify-center rounded-xl hover:bg-linen"
          >
            <X aria-hidden className="size-5" strokeWidth={1.8} />
          </button>
        </div>
        <p className="mb-3 text-caption text-muted">
          The hero photo is public: anyone visiting the site sees it.
        </p>
        <div className="grid grid-cols-3 gap-1.5 md:grid-cols-5">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => choose(p.id)}
              aria-label={`Use photo from ${p.entry?.title ?? "an unsorted upload"} as the hero`}
              aria-pressed={p.isHero}
              className={cn(
                "relative aspect-square overflow-hidden rounded-[10px] bg-tone-3 disabled:opacity-60",
                p.isHero && "ring-3 ring-accent-dark ring-inset",
              )}
            >
              <CloudImage
                sources={p.sources}
                blurDataUrl={p.blurDataUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 140px, 33vw"
                className="object-cover"
              />
              {p.isHero && (
                <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-accent-dark text-white">
                  <Check aria-hidden className="size-4" strokeWidth={2.2} />
                </span>
              )}
            </button>
          ))}
        </div>
      </dialog>
    </div>
  );
}

// About photos ------------------------------------------------------------------------------

function AboutPhotos({ photos }: { photos: LibraryPhoto[] }) {
  const router = useRouter();
  const initial = photos
    .filter((p) => p.onAbout)
    .sort((a, b) => (a.aboutSortOrder ?? Infinity) - (b.aboutSortOrder ?? Infinity));
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Pick up changes from elsewhere (e.g. after a refresh).
  const signature = initial.map((p) => p.id).join(",");
  const [seen, setSeen] = useState(signature);
  if (seen !== signature) {
    setSeen(signature);
    setItems(initial);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((p) => p.id === active.id);
    const to = items.findIndex((p) => p.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    startTransition(async () => {
      const res = await reorderAboutPhotos(next.map((p) => p.id));
      setError(res.error);
      router.refresh();
    });
  }

  function remove(p: LibraryPhoto) {
    setItems((all) => all.filter((it) => it.id !== p.id));
    startTransition(async () => {
      const res = await updatePhoto({
        id: p.id,
        inGallery: p.inGallery,
        onAbout: false,
        caption: p.caption ?? "",
      });
      setError(res.error);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section">About photos</h2>
      <p className="text-caption text-muted">
        Drag to change the order. Add photos with &ldquo;On About page&rdquo; under{" "}
        <Link href="/admin/photos">Photos</Link>.
      </p>
      {error && <p className="text-caption text-danger-text">{error}</p>}
      {items.length === 0 ? (
        <p className="rounded-xl bg-linen px-4 py-5 text-center text-ink-soft">
          No About photos yet.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col">
              {items.map((p, i) => (
                <AboutPhotoRow key={p.id} photo={p} n={i + 1} onRemove={() => remove(p)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function AboutPhotoRow({
  photo,
  n,
  onRemove,
}: {
  photo: LibraryPhoto;
  n: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border-b border-divider bg-ivory py-2",
        isDragging && "relative z-10 rounded-xl shadow-menu",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag to reorder About photo ${n}`}
        className="flex h-11 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-disabled"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden className="size-5" strokeWidth={1.8} />
      </button>
      <div className="relative size-15 shrink-0 overflow-hidden rounded-lg bg-tone-3">
        <CloudImage sources={photo.sources} alt="" fill sizes="60px" className="object-cover" />
      </div>
      <span className="min-w-0 flex-1 truncate text-label text-ink-soft">
        {photo.caption || photo.entry?.title || "Unsorted upload"}
      </span>
      <button
        type="button"
        aria-label={`Remove photo ${n} from the About page`}
        onClick={onRemove}
        className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger-text"
      >
        <X aria-hidden className="size-5" strokeWidth={1.8} />
      </button>
    </li>
  );
}
