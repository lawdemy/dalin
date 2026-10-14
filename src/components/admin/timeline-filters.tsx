"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Chip } from "@/components/ui/chip";
import { Input, Select } from "@/components/ui/input";
import { CATEGORIES, MOODS } from "@/lib/constants";
import { filtersToParams } from "@/lib/filters";
import type { Author, EntryFilters } from "@/lib/queries/entries";
import { cn } from "@/lib/utils";

type TimelineFiltersProps = { filters: EntryFilters; authors: Author[] };

/** Search, visibility chips and "More filters"; every change updates the URL. */
export function TimelineFilters({ filters, authors }: TimelineFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");

  function apply(patch: Partial<EntryFilters>) {
    const next = { ...filters, ...patch, limit: undefined };
    const qs = filtersToParams(next).toString();
    startTransition(() => router.replace(qs ? `/admin/timeline?${qs}` : "/admin/timeline"));
  }

  // Search as you type, after a short pause.
  useEffect(() => {
    if (q.trim() === (filters.q ?? "")) return;
    const t = setTimeout(() => apply({ q: q.trim() || undefined }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply changes every render
  }, [q]);

  const moreActive = Boolean(
    filters.category || filters.mood || filters.author || filters.from || filters.to,
  );

  return (
    <div className={cn("flex flex-col gap-3 transition-opacity", pending && "opacity-70")}>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted"
          strokeWidth={1.8}
        />
        <Input
          type="search"
          aria-label="Search entries"
          placeholder="Search entries"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10.5"
        />
      </div>

      <div role="group" aria-label="Visibility" className="flex flex-wrap gap-2">
        {(
          [
            ["All", undefined],
            ["Private", "private"],
            ["Public", "public"],
          ] as const
        ).map(([label, value]) => (
          <Chip
            key={label}
            selected={filters.visibility === value}
            onClick={() => apply({ visibility: value })}
          >
            {label}
          </Chip>
        ))}
      </div>

      <details open={moreActive} className="group rounded-xl border border-sand">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3.5 text-label font-medium">
          <SlidersHorizontal aria-hidden className="size-4.5 text-accent" strokeWidth={1.8} />
          More filters
          {moreActive && <span className="text-muted">(on)</span>}
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-sand p-3.5">
          <label className="flex flex-col gap-1.5 text-label font-medium">
            Category
            <Select
              value={filters.category ?? ""}
              onChange={(e) =>
                apply({ category: (e.target.value || undefined) as EntryFilters["category"] })
              }
            >
              <option value="">Any</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-label font-medium">
            Mood
            <Select
              value={filters.mood ?? ""}
              onChange={(e) =>
                apply({ mood: (e.target.value || undefined) as EntryFilters["mood"] })
              }
            >
              <option value="">Any</option>
              {MOODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="col-span-2 flex flex-col gap-1.5 text-label font-medium">
            Written by
            <Select
              value={filters.author ?? ""}
              onChange={(e) => apply({ author: e.target.value || undefined })}
            >
              <option value="">Either of us</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-label font-medium">
            From
            <Input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => apply({ from: e.target.value || undefined })}
              className="px-2.5"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-label font-medium">
            To
            <Input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => apply({ to: e.target.value || undefined })}
              className="px-2.5"
            />
          </label>
          {moreActive && (
            <button
              type="button"
              onClick={() =>
                apply({
                  category: undefined,
                  mood: undefined,
                  author: undefined,
                  from: undefined,
                  to: undefined,
                })
              }
              className="col-span-2 min-h-11 justify-self-start text-label font-medium text-accent-dark"
            >
              Clear these filters
            </button>
          )}
        </div>
      </details>
    </div>
  );
}
