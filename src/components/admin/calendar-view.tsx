"use client";

import { addMonths, format, getDaysInMonth, getISODay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { EntryRow } from "@/components/admin/entry-row";
import { buttonClasses } from "@/components/ui/button";
import type { EntryListItem } from "@/lib/queries/entries";
import { cn } from "@/lib/utils";

type CalendarViewProps = {
  /** yyyy-mm */
  month: string;
  entries: EntryListItem[];
  /** yyyy-mm-dd in the diary's time zone. */
  today: string;
  /** Day selected on load (yyyy-mm-dd), if any. */
  initialDay: string | null;
  secondAuthorId?: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView({
  month,
  entries,
  today,
  initialDay,
  secondAuthorId,
}: CalendarViewProps) {
  const router = useRouter();
  const first = parseISO(`${month}-01`);
  const days = getDaysInMonth(first);
  const lead = getISODay(first) - 1; // blanks before the 1st (Monday-first)
  const [selected, setSelected] = useState<string | null>(initialDay);
  const touchX = useRef<number | null>(null);

  const byDay = new Map<string, EntryListItem[]>();
  for (const e of entries) byDay.set(e.entryDate, [...(byDay.get(e.entryDate) ?? []), e]);

  const prev = format(addMonths(first, -1), "yyyy-MM");
  const next = format(addMonths(first, 1), "yyyy-MM");
  const dayKey = (d: number) => `${month}-${String(d).padStart(2, "0")}`;
  const selectedEntries = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div
      className="flex flex-col gap-4"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 60) router.push(`/admin/calendar?month=${dx < 0 ? next : prev}`);
      }}
    >
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/calendar?month=${prev}`}
          aria-label="Previous month"
          className="flex size-11 items-center justify-center rounded-xl text-ink hover:bg-linen hover:text-ink"
        >
          <ChevronLeft aria-hidden className="size-5.5" strokeWidth={1.8} />
        </Link>
        <h2 className="text-card" aria-live="polite">
          {format(first, "MMMM yyyy")}
        </h2>
        <Link
          href={`/admin/calendar?month=${next}`}
          aria-label="Next month"
          className="flex size-11 items-center justify-center rounded-xl text-ink hover:bg-linen hover:text-ink"
        >
          <ChevronRight aria-hidden className="size-5.5" strokeWidth={1.8} />
        </Link>
      </div>

      <div>
        <div className="grid grid-cols-7 pb-1" aria-hidden>
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-center text-micro font-medium text-muted">
              {d}
            </span>
          ))}
        </div>
        <div
          className="grid grid-cols-7 gap-0.5"
          role="group"
          aria-label={format(first, "MMMM yyyy")}
        >
          {Array.from({ length: lead }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden className="h-12" />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1;
            const key = dayKey(d);
            const count = byDay.get(key)?.length ?? 0;
            const isSel = key === selected;
            const isToday = key === today;
            const label = `${format(parseISO(key), "EEEE d MMMM")}${count ? `, ${count} ${count === 1 ? "entry" : "entries"}` : ""}`;
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={isSel}
                onClick={() => setSelected(key)}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-[1.5px] text-[0.9375rem]",
                  isSel
                    ? "border-transparent bg-ink text-ivory"
                    : "border-transparent hover:bg-linen",
                  isToday && !isSel && "border-accent",
                  (isToday || isSel) && "font-semibold",
                )}
              >
                {d}
                <span
                  aria-hidden
                  className={cn(
                    "size-1.25 rounded-full",
                    count ? (isSel ? "bg-accent-light" : "bg-accent") : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <section aria-label="Selected day" className="flex flex-col gap-2 pt-2">
          <h3 className="text-quote">{format(parseISO(selected), "EEEE d MMMM")}</h3>
          {selectedEntries.length ? (
            <ul className="flex flex-col gap-2">
              {selectedEntries.map((e, i) => (
                <li key={e.id} className="rounded-xl border border-sand px-3">
                  <EntryRow
                    entry={e}
                    index={i}
                    altTone={e.authorId === secondAuthorId}
                    dateLabel={e.authorName || format(parseISO(e.entryDate), "EEE d")}
                    className="py-2.5"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-linen px-4 py-6 text-center">
              <p className="text-ink-soft">Nothing written on this day.</p>
              <Link
                href={`/admin/entries/new?date=${selected}`}
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                Write about it
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
