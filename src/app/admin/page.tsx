import { addDays, differenceInCalendarMonths, format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DailyWords } from "@/components/admin/daily-word";
import { AdminEntryCard } from "@/components/admin/entry-card";
import { NEW_ENTRY_HREF } from "@/components/admin/nav-items";
import { NotesPanel } from "@/components/admin/notes-panel";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireMember } from "@/lib/auth";
import { signedSources } from "@/lib/cloudinary";
import { wordsForDay } from "@/lib/daily-words";
import { greetingInDiary, longTodayInDiary, todayInDiary } from "@/lib/format";
import { listAuthors, listEntries, type EntryListItem } from "@/lib/queries/entries";
import { getDashboardNotes } from "@/lib/queries/notes";

/** How many entries the dashboard shows before pointing to the Timeline. */
const LIMIT = 500;

export default async function DashboardPage() {
  const member = await requireMember();
  const [{ entries, hasMore }, notes] = await Promise.all([
    listEntries({ limit: LIMIT }),
    getDashboardNotes(),
  ]);
  // The second of us (by account age) gets the other half of each list.
  const authors = await listAuthors();
  const viewer = authors.findIndex((a) => a.id === member.id) === 1 ? 1 : 0;

  const now = new Date();
  const today = todayInDiary(now);
  const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");
  const thisMonth = today.slice(0, 7);
  const inMonth = entries.filter((e) => e.entryDate.startsWith(thisMonth)).length;
  const shared = entries.filter((e) => e.visibility === "public").length;
  const memories = onThisDay(entries, today);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-caption text-muted">{longTodayInDiary(now)}</span>
          <h1 className="text-section-lg leading-tight">
            {greetingInDiary(now)}, {member.displayName}
          </h1>
        </div>
        <Avatar
          name={member.displayName}
          size="md"
          image={member.avatarPath ? signedSources(member.avatarPath, 256) : null}
        />
      </header>

      <section aria-label="For you today" className="flex flex-col gap-3">
        <DailyWords words={wordsForDay(today, viewer)} />
        <NotesPanel notes={notes} today={today} tomorrow={tomorrow} />
        {notes.setupNeeded && (
          <p className="text-caption text-muted">
            Personal notes switch on once migrations 0006 and 0008 have been run in Supabase.
          </p>
        )}
      </section>

      <Link
        href={NEW_ENTRY_HREF}
        className={buttonClasses({ size: "lg", fullWidth: true, className: "h-14" })}
      >
        <Plus aria-hidden className="size-5" strokeWidth={2} />
        New entry
      </Link>

      <section aria-label="Counts" className="grid grid-cols-3 gap-3">
        <Stat value={inMonth} label={`in ${format(parseISO(`${thisMonth}-01`), "MMMM")}`} />
        <Stat value={shared} label="shared publicly" />
        <Stat value={hasMore ? `${LIMIT}+` : entries.length} label="entries in all" />
      </section>

      {memories.length > 0 && (
        <section aria-labelledby="on-this-day" className="flex flex-col gap-3">
          <h2 id="on-this-day" className="text-section">
            On this day
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memories.map(({ entry, ago }, i) => (
              <AdminEntryCard key={entry.id} entry={entry} index={i} note={ago} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="all-entries" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="all-entries" className="text-section">
            All our entries
          </h2>
          <Link
            href="/admin/timeline"
            className="flex min-h-11 items-center text-[0.9375rem] font-medium no-underline"
          >
            Search &amp; filter
          </Link>
        </div>
        {entries.length === 0 ? (
          <EmptyState title="No entries yet" description="Your first page is waiting." />
        ) : (
          <>
            <p className="text-caption text-muted">
              Private and public. Tap a photo to view and zoom; tap the title to open the entry.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry, i) => (
                <AdminEntryCard key={entry.id} entry={entry} index={i} />
              ))}
            </div>
            {hasMore && (
              <Link
                href="/admin/timeline"
                className={buttonClasses({ variant: "secondary", className: "self-center" })}
              >
                See older entries in the Timeline
              </Link>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-linen p-3 md:p-4">
      <span className="font-serif text-title leading-none font-semibold">{value}</span>
      <span className="text-caption leading-tight text-muted">{label}</span>
    </div>
  );
}

/** Earlier entries from the same day of the month: "1 year ago", "3 months ago". */
function onThisDay(entries: EntryListItem[], today: string) {
  const day = today.slice(8);
  return entries
    .filter((e) => e.entryDate < today && e.entryDate.slice(8) === day)
    .slice(0, 6)
    .map((entry) => {
      const months = differenceInCalendarMonths(parseISO(today), parseISO(entry.entryDate));
      const years = months / 12;
      const ago = Number.isInteger(years)
        ? `${years} year${years === 1 ? "" : "s"} ago`
        : `${months} month${months === 1 ? "" : "s"} ago`;
      return { entry, ago: `${ago} · ${format(parseISO(entry.entryDate), "d MMM yyyy")}` };
    });
}
