import { endOfMonth, format, parseISO } from "date-fns";
import type { Metadata } from "next";
import { CalendarView } from "@/components/admin/calendar-view";
import { todayInDiary } from "@/lib/format";
import { listAuthors, listEntries } from "@/lib/queries/entries";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: PageProps<"/admin/calendar">) {
  const params = await searchParams;
  const today = todayInDiary();
  const raw = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : today.slice(0, 7);

  const from = `${month}-01`;
  const to = format(endOfMonth(parseISO(from)), "yyyy-MM-dd");
  const [{ entries }, authors] = await Promise.all([
    listEntries({ from, to, limit: 1000 }),
    listAuthors(),
  ]);

  // Open on today when viewing this month, else on the latest day with entries.
  const initialDay = today.startsWith(month) ? today : (entries[0]?.entryDate ?? null);

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-4">
      <h1 className="text-title">Calendar</h1>
      <CalendarView
        key={month}
        month={month}
        entries={entries}
        today={today}
        initialDay={initialDay}
        secondAuthorId={authors[1]?.id}
      />
    </div>
  );
}
