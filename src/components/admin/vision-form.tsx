"use client";

import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { discardPhoto } from "@/app/admin/entries/actions";
import { deleteVision, saveVision } from "@/app/admin/vision/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CloudImage } from "@/components/ui/cloud-image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { VISION_AREA_SUGGESTIONS, VISION_STATUSES, type VisionStatus } from "@/lib/constants";
import { todayInDiary } from "@/lib/format";
import type { Photo } from "@/lib/images";
import type { Vision } from "@/lib/queries/visions";
import { UploadError, uploadPhoto } from "./upload-photo";

type VisionFormProps = {
  /** The vision being edited; omit for a new one. */
  vision?: Vision;
  /** Areas already on the board, offered next to the starting suggestions. */
  usedAreas: string[];
};

export function VisionForm({ vision, usedAreas }: VisionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(vision?.title ?? "");
  const [area, setArea] = useState(vision?.area ?? "");
  const [forWhom, setForWhom] = useState<"family" | "me">(vision?.ownerId ? "me" : "family");
  const [description, setDescription] = useState(vision?.description ?? "");
  const [targetDate, setTargetDate] = useState(vision?.targetDate ?? "");
  const [status, setStatus] = useState<VisionStatus>(vision?.status ?? "dreaming");
  const [achievedOn, setAchievedOn] = useState(vision?.achievedOn ?? "");
  const [photo, setPhoto] = useState<Photo | null>(vision?.photo ?? null);
  const [upload, setUpload] = useState<{ previewUrl: string; progress: number } | null>(null);
  const [uploadError, setUploadError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  // A photo uploaded in this form and not saved yet is deleted when replaced;
  // the saved one goes only when the change is saved.
  function discardUnsaved(current: Photo | null) {
    if (current && current.id !== vision?.photo?.id) void discardPhoto(current.id);
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setUploadError(undefined);
    setUpload({ previewUrl, progress: 0 });
    try {
      const uploaded = await uploadPhoto(file, (progress) => setUpload({ previewUrl, progress }));
      discardUnsaved(photo);
      setPhoto(uploaded);
    } catch (e) {
      setUploadError(e instanceof UploadError ? e.message : "That photo couldn't be uploaded.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUpload(null);
    }
  }

  function save() {
    setError(undefined);
    setErrors({});
    startTransition(async () => {
      const res = await saveVision({
        id: vision?.id,
        title,
        area,
        forWhom,
        description,
        targetDate,
        status,
        achievedOn,
        photoId: photo?.id ?? null,
      });
      if (res.error) {
        setError(res.error);
        setErrors(res.fieldErrors ?? {});
      } else if (res.id) {
        router.push(`/admin/vision/${res.id}`);
        router.refresh();
      }
    });
  }

  // Starting suggestions plus anything already used, without case-only repeats.
  const areaOptions = [
    ...new Map(
      [...VISION_AREA_SUGGESTIONS, ...usedAreas].map((a) => [a.trim().toLowerCase(), a.trim()]),
    ).values(),
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mx-auto flex w-full max-w-180 flex-col gap-6"
      noValidate
    >
      <Link
        href={vision ? `/admin/vision/${vision.id}` : "/admin/vision"}
        className="-ml-3 inline-flex min-h-11 items-center gap-1 self-start rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
        {vision ? "Back to the vision" : "Vision board"}
      </Link>
      <h1 className="text-title">{vision ? "Edit vision" : "Add a vision"}</h1>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">Whose vision is this?</legend>
        <div className="flex flex-wrap gap-2">
          <Chip size="lg" selected={forWhom === "family"} onClick={() => setForWhom("family")}>
            Our family
          </Chip>
          <Chip size="lg" selected={forWhom === "me"} onClick={() => setForWhom("me")}>
            Just me
          </Chip>
        </div>
      </fieldset>

      <Field id="title" label="The vision" required error={errors.title}>
        <Input
          id="title"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title) || undefined}
          aria-describedby={describedBy("title", { error: errors.title })}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <Field
          id="area"
          label="Area of life"
          required
          hint="Type anything, or pick one below."
          error={errors.area}
        >
          <Input
            id="area"
            value={area}
            maxLength={60}
            onChange={(e) => setArea(e.target.value)}
            aria-invalid={Boolean(errors.area) || undefined}
            aria-describedby={describedBy("area", { hint: true, error: errors.area })}
          />
        </Field>
        <div role="group" aria-label="Suggested areas" className="flex flex-wrap gap-2">
          {areaOptions.map((option) => (
            <Chip
              key={option}
              selected={area.trim().toLowerCase() === option.toLowerCase()}
              onClick={() => setArea(option)}
            >
              {option}
            </Chip>
          ))}
        </div>
      </div>

      <section aria-labelledby="picture-label" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span id="picture-label" className="text-label font-medium">
            Picture
          </span>
          <span className="text-micro text-muted">Location data is removed on upload</span>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void pickPhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {upload || photo ? (
          <div className="relative aspect-4/3 max-w-80 overflow-hidden rounded-xl bg-tone-2">
            {upload ? (
              <>
                <Image
                  src={upload.previewUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="320px"
                  className="object-cover"
                />
                <div
                  role="progressbar"
                  aria-label="Uploading picture"
                  aria-valuenow={upload.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="absolute inset-0 flex items-center justify-center bg-ink/45 text-label font-semibold text-white"
                >
                  {upload.progress}%
                </div>
              </>
            ) : (
              photo && (
                <CloudImage
                  sources={photo.sources}
                  blurDataUrl={photo.blurDataUrl}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              )
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex h-22 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-stitch bg-linen font-medium text-ink-soft hover:bg-sand/50"
          >
            <ImagePlus aria-hidden className="size-6 text-accent" strokeWidth={1.6} />
            Add a picture
          </button>
        )}
        {photo && !upload && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
              Change picture
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                discardUnsaved(photo);
                setPhoto(null);
              }}
            >
              Remove picture
            </Button>
          </div>
        )}
        {uploadError && <p className="text-caption text-danger-text">{uploadError}</p>}
      </section>

      <Field
        id="description"
        label="What it looks like, and why it matters"
        error={errors.description}
      >
        <Textarea
          id="description"
          rows={5}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errors.description) || undefined}
          aria-describedby={describedBy("description", { error: errors.description })}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">Where is it now?</legend>
        <div className="flex flex-wrap gap-2">
          {VISION_STATUSES.map((s) => (
            <Chip
              key={s.value}
              size="lg"
              selected={status === s.value}
              onClick={() => {
                setStatus(s.value);
                if (s.value === "achieved" && !achievedOn) setAchievedOn(todayInDiary());
              }}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="targetDate" label="Hoping for (optional)" error={errors.targetDate}>
          <Input
            id="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            aria-invalid={Boolean(errors.targetDate) || undefined}
            aria-describedby={describedBy("targetDate", { error: errors.targetDate })}
          />
        </Field>
        {status === "achieved" && (
          <Field id="achievedOn" label="Achieved on" error={errors.achievedOn}>
            <Input
              id="achievedOn"
              type="date"
              value={achievedOn}
              onChange={(e) => setAchievedOn(e.target.value)}
              aria-invalid={Boolean(errors.achievedOn) || undefined}
              aria-describedby={describedBy("achievedOn", { error: errors.achievedOn })}
            />
          </Field>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-danger-text">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {vision ? (
          <ConfirmDialog
            title="Delete this vision?"
            description={<>“{vision.title}” will be deleted for good.</>}
            onConfirm={() => deleteVision(vision.id)}
            trigger={(open) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={open}
                className="px-1 text-danger-text hover:text-danger-text"
              >
                <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
                Delete vision
              </Button>
            )}
          />
        ) : (
          <span />
        )}
        <Button type="submit" pending={pending} disabled={Boolean(upload)}>
          {vision ? "Save changes" : "Add to the board"}
        </Button>
      </div>
    </form>
  );
}
