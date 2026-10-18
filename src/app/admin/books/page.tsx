import { NotebookPen, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { VisibilityBadge } from "@/components/ui/visibility-badge";
import { BOOK_STATUSES } from "@/lib/constants";
import { bookDates } from "@/lib/format";
import { bookNoteCounts, listBooks } from "@/lib/queries/books";

export const metadata: Metadata = { title: "Bookshelf" };

export default async function BookshelfPage() {
  const { books, setupNeeded } = await listBooks(); // checks membership
  const counts = await bookNoteCounts(books.map((b) => b.id));
  const shelves = BOOK_STATUSES.map((s) => ({
    ...s,
    books: books.filter((b) => b.status === s.value),
  })).filter((s) => s.books.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title">Bookshelf</h1>
        {!setupNeeded && (
          <Link href="/admin/books/new" className={buttonClasses({ size: "sm" })}>
            <Plus aria-hidden className="size-4.5" strokeWidth={2} />
            Add a book
          </Link>
        )}
      </div>
      <p className="-mt-3 text-muted">
        The books you&rsquo;re reading together. Public ones appear on{" "}
        <Link href="/books">the public bookshelf</Link> with a link to get a copy; the book files
        themselves are never uploaded.
      </p>

      {setupNeeded ? (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          The bookshelf switches on once migration 0009 has been run in Supabase.
        </p>
      ) : shelves.length === 0 ? (
        <EmptyState
          title="No books yet"
          description="Add the book you're reading together."
          action={
            <Link href="/admin/books/new" className={buttonClasses({ size: "sm" })}>
              Add a book
            </Link>
          }
        />
      ) : (
        shelves.map((shelf) => (
          <section
            key={shelf.value}
            aria-labelledby={`shelf-${shelf.value}`}
            className="flex flex-col gap-3"
          >
            <h2 id={`shelf-${shelf.value}`} className="text-section">
              {shelf.label}
            </h2>
            <ul className="flex flex-col divide-y divide-divider">
              {shelf.books.map((book) => {
                const dates = bookDates(book.startedOn, book.finishedOn);
                const notes = counts.get(book.id) ?? 0;
                return (
                  <li key={book.id}>
                    <Link
                      href={`/admin/books/${book.id}`}
                      className="flex items-center gap-4 py-3 text-ink no-underline hover:text-ink"
                    >
                      <BookCover title={book.title} author={book.author} size="sm" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-serif text-card-sm font-semibold">{book.title}</span>
                        <span className="text-label text-ink-soft">{book.author}</span>
                        <span className="flex flex-wrap items-center gap-x-3 text-caption text-muted">
                          {dates && <span>{dates}</span>}
                          {notes > 0 && (
                            <span className="flex items-center gap-1">
                              <NotebookPen aria-hidden className="size-3.5" strokeWidth={1.8} />
                              {notes} note{notes === 1 ? "" : "s"}
                            </span>
                          )}
                        </span>
                      </div>
                      <VisibilityBadge visibility={book.visibility} compact />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
