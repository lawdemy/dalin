import { ArrowLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/chip";
import { CloudImage } from "@/components/ui/cloud-image";
import { formatLongDate, visionStatusLabel } from "@/lib/format";
import { getVision } from "@/lib/queries/visions";

export const metadata: Metadata = { title: "Vision" };

export default async function VisionPage({ params }: PageProps<"/admin/vision/[id]">) {
  const { id } = await params;
  const vision = await getVision(id); // checks membership
  if (!vision) notFound();

  return (
    <article className="mx-auto flex w-full max-w-180 flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin/vision"
          className="-ml-3 inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
          Vision board
        </Link>
        {vision.canEdit && (
          <Link
            href={`/admin/vision/${vision.id}/edit`}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            <Pencil aria-hidden className="size-4" strokeWidth={1.8} />
            Edit
          </Link>
        )}
      </div>

      {vision.photo && (
        <CloudImage
          sources={vision.photo.sources}
          blurDataUrl={vision.photo.blurDataUrl}
          alt={vision.photo.alt}
          width={vision.photo.width}
          height={vision.photo.height}
          sizes="(min-width: 768px) 720px, 100vw"
          className="h-auto w-full rounded-xl"
          priority
        />
      )}

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{vision.area}</Tag>
          <Tag>{vision.ownerName ?? "Family"}</Tag>
          <Tag>{visionStatusLabel(vision.status)}</Tag>
        </div>
        <h1 className="text-section md:text-title">{vision.title}</h1>
        {vision.achievedOn ? (
          <p className="text-caption text-muted">Achieved {formatLongDate(vision.achievedOn)}</p>
        ) : vision.targetDate ? (
          <p className="text-caption text-muted">Hoping for {formatLongDate(vision.targetDate)}</p>
        ) : null}
      </header>

      {vision.description && (
        <p className="whitespace-pre-line text-ink-soft">{vision.description}</p>
      )}
    </article>
  );
}
