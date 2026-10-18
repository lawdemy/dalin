import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingNotes } from "@/components/admin/reading-notes";
import { BookCover } from "@/components/books/book-cover";
import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/chip";
import { VisibilityBadge } from "@/components/ui/visibility-badge";
import { requireMember } from "@/lib/auth";
import { bookDates, bookStatusLabel } from "@/lib/format";
import { getBook, getBookNotes } from "@/lib/queries/books";

export const metadata: Metadata = { title: "Book" };

/** One book: what we share about it, plus our private reading notes. */
export default async function BookPage({ params }: PageProps<"/admin/books/[id]">) {
  const { id } = await params;
  const book = await getBook(id); // checks membership
  if (!book) notFound();
  const [me, notes] = await Promise.all([requireMember(), getBookNotes(book.id)]);
  const dates = bookDates(book.startedOn, book.finishedOn);

  return (
    <article className="mx-auto flex w-full max-w-180 flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin/books"
          className="-ml-3 inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
          Bookshelf
        </Link>
        <Link
          href={`/admin/books/${book.id}/edit`}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          <Pencil aria-hidden className="size-4" strokeWidth={1.8} />
          Edit
        </Link>
      </div>

      <header className="flex gap-5">
        <BookCover title={book.title} author={book.author} />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{bookStatusLabel(book.status)}</Tag>
            <VisibilityBadge visibility={book.visibility} />
          </div>
          <h1 className="text-section md:text-title">{book.title}</h1>
          <p className="text-ink-soft">by {book.author}</p>
          {dates && <p className="text-caption text-muted">{dates}</p>}
        </div>
      </header>

      {(book.buyUrl || book.visibility === "public") && (
        <div className="-my-2 flex flex-wrap gap-x-5">
          {book.buyUrl && (
            <a
              href={book.buyUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium"
            >
              <ExternalLink aria-hidden className="size-4" strokeWidth={1.8} />
              Where to get it
            </a>
          )}
          {book.visibility === "public" && (
            <Link
              href="/books"
              className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium"
            >
              <ExternalLink aria-hidden className="size-4" strokeWidth={1.8} />
              View on the public bookshelf
            </Link>
          )}
        </div>
      )}

      {book.quote && (
        <blockquote className="border-l-2 border-accent pl-4 font-serif text-quote leading-snug italic">
          &ldquo;{book.quote}&rdquo;
        </blockquote>
      )}
      {book.reflection ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-section">What we&rsquo;re learning</h2>
          <p className="whitespace-pre-line text-ink-soft">{book.reflection}</p>
        </section>
      ) : (
        <p className="text-muted">
          Nothing shared yet.{" "}
          <Link href={`/admin/books/${book.id}/edit`}>Add what you&rsquo;re learning</Link>.
        </p>
      )}

      <ReadingNotes bookId={book.id} notes={notes} meId={me.id} />
    </article>
  );
}
