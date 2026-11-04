"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CloudImage } from "@/components/ui/cloud-image";
import { EmptyState } from "@/components/ui/empty-state";
import { placeholderTone } from "@/components/ui/photo-tile";
import type { Vision, VisionPerson } from "@/lib/queries/visions";
import { cn } from "@/lib/utils";

type VisionBoardProps = {
  visions: Vision[];
  people: VisionPerson[];
  meId: string;
};

const areaKey = (area: string) => area.trim().toLowerCase();

/** The board: filter by whose vision and by area; grouped by area, A to Z. */
export function VisionBoard({ visions, people, meId }: VisionBoardProps) {
  const [who, setWho] = useState("all");
  const [area, setArea] = useState("all");

  // "faith" and "Faith" are one area, under whichever spelling came first.
  const areas = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const v of visions) if (!byKey.has(areaKey(v.area))) byKey.set(areaKey(v.area), v.area);
    return [...byKey].sort((a, b) => a[1].localeCompare(b[1]));
  }, [visions]);

  if (visions.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nothing on the board yet"
        description="Add the first thing you're reaching for, big or small."
        action={
          <Link href="/admin/vision/new" className={buttonClasses({ size: "sm" })}>
            Add a vision
          </Link>
        }
      />
    );
  }

  const shown = visions.filter(
    (v) =>
      (who === "all" || (who === "family" ? v.ownerId === null : v.ownerId === who)) &&
      (area === "all" || areaKey(v.area) === area),
  );
  const whoChips = [
    { value: "all", label: "Everything" },
    { value: "family", label: "Family" },
    ...[...people]
      .sort((a, b) => Number(b.id === meId) - Number(a.id === meId))
      .map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        <div role="group" aria-label="Whose vision" className="flex flex-wrap gap-2">
          {whoChips.map((c) => (
            <Chip key={c.value} selected={who === c.value} onClick={() => setWho(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
        <div role="group" aria-label="Area of life" className="flex flex-wrap gap-2">
          <Chip selected={area === "all"} onClick={() => setArea("all")}>
            All areas
          </Chip>
          {areas.map(([key, label]) => (
            <Chip key={key} selected={area === key} onClick={() => setArea(key)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Sparkles} title="Nothing here yet" description="Try another filter." />
      ) : (
        areas
          .map(([key, label]) => ({
            key,
            label,
            items: shown.filter((v) => areaKey(v.area) === key),
          }))
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="text-section">{group.label}</h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {group.items.map((vision, i) => (
                  <li key={vision.id}>
                    <VisionCard vision={vision} tone={i} />
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </>
  );
}

function VisionCard({ vision, tone }: { vision: Vision; tone: number }) {
  return (
    <Link
      href={`/admin/vision/${vision.id}`}
      className="flex h-full flex-col gap-2 text-ink no-underline hover:text-ink"
    >
      <div className={cn("relative aspect-4/5 overflow-hidden rounded-xl", placeholderTone(tone))}>
        {vision.photo ? (
          <CloudImage
            sources={vision.photo.sources}
            blurDataUrl={vision.photo.blurDataUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 300px, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center p-3 text-center font-serif text-card-sm font-semibold text-tone-ink">
            {vision.title}
          </span>
        )}
        {vision.status === "achieved" && (
          <span className="absolute top-2 left-2 rounded-full bg-ivory px-2.5 py-1 text-micro font-semibold text-ink">
            Achieved
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        {vision.photo && (
          <span className="font-serif text-card-sm font-semibold wrap-break-word">
            {vision.title}
          </span>
        )}
        <span className="text-caption text-muted">{vision.ownerName ?? "Family"}</span>
      </div>
    </Link>
  );
}
