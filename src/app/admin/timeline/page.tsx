import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { EntryRow } from "@/components/admin/entry-row";
import { NEW_ENTRY_HREF } from "@/components/admin/nav-items";
import { TimelineFilters } from "@/components/admin/timeline-filters";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { filtersToParams, parseEntryFilters } from "@/lib/filters";
import { listAuthors, listEntries, type EntryListItem } from "@/lib/queries/entries";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage({ searchParams }: PageProps<"/admin/timeline">) {
  const filters = parseEntryFilters(await searchParams);
  const [{ entries, hasMore }, authors] = await Promise.all([listEntries(filters), listAuthors()]);
  const months = groupByMonth(entries);
  const filtered = Boolean(
    filters.q ||
    filters.visibility ||
    filters.category ||
    filters.mood ||
    filters.author ||
    filters.from ||
    filters.to,
  );
  const secondAuthor = authors[1]?.id;

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-4">
      <h1 className="text-title">Timeline</h1>
      <TimelineFilters
        key={filtersToParams({ ...filters, limit: undefined }).toString()}
        filters={filters}
        authors={authors}
      />

      {entries.length === 0 ? (
        filtered ? (
          <EmptyState
            title="Nothing matches"
            description="Try a different search or fewer filters."
          />
        ) : (
          <EmptyState
            title="No entries yet"
            description="Your first page is waiting."
            action={
              <Link href={NEW_ENTRY_HREF} className={buttonClasses({ size: "sm" })}>
                Write the first one
              </Link>
            }
          />
        )
      ) : (
        <div className="flex flex-col">
          {months.map(({ key, label, items }) => (
            <section key={key} aria-labelledby={`month-${key}`}>
              <h2
                id={`month-${key}`}
                className="flex items-baseline justify-between pt-4 pb-1 text-quote font-semibold"
              >
                {label}
                <span className="font-sans text-caption font-normal text-muted">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </span>
              </h2>
              <ul>
                {items.map((entry, i) => (
                  <li key={entry.id} className="border-b border-divider">
                    <EntryRow
                      entry={entry}
                      index={i}
                      altTone={entry.authorId === secondAuthor}
                      dateLabel={format(parseISO(entry.entryDate), "EEE d")}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {hasMore && (
            <Link
              href={`/admin/timeline?${filtersToParams({ ...filters, limit: (filters.limit ?? 100) + 100 })}`}
              scroll={false}
              className={buttonClasses({ variant: "secondary", className: "mt-6 self-center" })}
            >
              Show older entries
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function groupByMonth(entries: EntryListItem[]) {
  const groups: { key: string; label: string; items: EntryListItem[] }[] = [];
  for (const entry of entries) {
    const key = entry.entryDate.slice(0, 7);
    let group = groups.at(-1);
    if (group?.key !== key) {
      group = { key, label: format(parseISO(`${key}-01`), "MMMM yyyy"), items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  }
  return groups;
}
