import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { BookCover } from "@/components/books/book-cover";
import { Eyebrow } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { BOOK_STATUSES } from "@/lib/constants";
import { bookDates } from "@/lib/format";
import { shareMetadata } from "@/lib/metadata";
import type { Book } from "@/lib/queries/books";
import { getPublicBooks, getSiteSettings } from "@/lib/queries/public";

export async function generateMetadata(): Promise<Metadata> {
  const { coupleNames } = await getSiteSettings();
  const description = `The books ${coupleNames} are reading together.`;
  return {
    title: "Bookshelf",
    description,
    ...shareMetadata({ title: `Bookshelf · ${coupleNames}`, description }),
  };
}

export default async function BooksPage() {
  const books = await getPublicBooks();
  const shelves = BOOK_STATUSES.map((s) => ({
    ...s,
    books: books.filter((b) => b.status === s.value),
  })).filter((s) => s.books.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-200 flex-col px-5 pb-16 md:px-6 md:pb-24">
      <header className="flex flex-col items-center gap-2 pt-10 pb-8 text-center md:pt-12">
        <Eyebrow>Our bookshelf</Eyebrow>
        <h1 className="text-title md:text-title-lg">What we&rsquo;re reading together</h1>
        <p className="max-w-130 text-muted">
          The books shaping our life together, with what we&rsquo;re learning from them. If one
          speaks to you, follow the link to get your own copy.
        </p>
      </header>

      {shelves.length === 0 ? (
        <EmptyState
          title="The shelf is empty for now"
          description="Our first book is on its way."
        />
      ) : (
        <div className="flex flex-col gap-12">
          {shelves.map((shelf) => (
            <section
              key={shelf.value}
              aria-labelledby={`shelf-${shelf.value}`}
              className="flex flex-col gap-5"
            >
              <h2 id={`shelf-${shelf.value}`} className="text-section md:text-section-lg">
                {shelf.label}
              </h2>
              <ul className="flex flex-col gap-5">
                {shelf.books.map((book) => (
                  <li key={book.id}>
                    <PublicBook book={book} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function PublicBook({ book }: { book: Book }) {
  const dates = bookDates(book.startedOn, book.finishedOn);
  return (
    <article className="flex gap-4 rounded-xl bg-linen p-4 md:gap-6 md:p-6">
      <BookCover title={book.title} author={book.author} className="max-md:hidden" />
      <BookCover title={book.title} author={book.author} size="sm" className="md:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-serif text-card font-semibold">{book.title}</h3>
          <p className="text-label text-ink-soft">by {book.author}</p>
          {dates && <p className="text-caption text-muted">{dates}</p>}
        </div>
        {book.quote && (
          <blockquote className="border-l-2 border-accent pl-3 font-serif text-quote leading-snug italic">
            &ldquo;{book.quote}&rdquo;
          </blockquote>
        )}
        {book.reflection && <p className="whitespace-pre-line text-ink-soft">{book.reflection}</p>}
        {book.buyUrl && (
          <a
            href={book.buyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-11 items-center gap-1.5 self-start font-medium"
          >
            Get the book
            <ExternalLink aria-hidden className="size-4" strokeWidth={1.8} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </article>
  );
}
