"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBook, saveBook } from "@/app/admin/books/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import type { Visibility } from "@/components/ui/visibility-badge";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { BOOK_STATUSES, type BookStatus } from "@/lib/constants";
import type { Book } from "@/lib/queries/books";

type BookFormProps = {
  /** The book being edited; omit for a new one. */
  book?: Book;
};

export function BookForm({ book }: BookFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [status, setStatus] = useState<BookStatus>(book?.status ?? "reading");
  const [startedOn, setStartedOn] = useState(book?.startedOn ?? "");
  const [finishedOn, setFinishedOn] = useState(book?.finishedOn ?? "");
  const [buyUrl, setBuyUrl] = useState(book?.buyUrl ?? "");
  const [quote, setQuote] = useState(book?.quote ?? "");
  const [reflection, setReflection] = useState(book?.reflection ?? "");
  const [visibility, setVisibility] = useState<Visibility>(book?.visibility ?? "private");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function save() {
    setError(undefined);
    setErrors({});
    startTransition(async () => {
      const res = await saveBook({
        id: book?.id,
        title,
        author,
        status,
        startedOn,
        finishedOn,
        buyUrl,
        quote,
        reflection,
        visibility,
      });
      if (res.error) {
        setError(res.error);
        setErrors(res.fieldErrors ?? {});
      } else if (res.id) {
        router.push(`/admin/books/${res.id}`);
        router.refresh();
      }
    });
  }

  const text = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    props: {
      required?: boolean;
      hint?: string;
      type?: string;
      placeholder?: string;
      max?: number;
    } = {},
  ) => (
    <Field id={id} label={label} required={props.required} hint={props.hint} error={errors[id]}>
      <Input
        id={id}
        type={props.type ?? "text"}
        value={value}
        maxLength={props.max}
        placeholder={props.placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(errors[id]) || undefined}
        aria-describedby={describedBy(id, { hint: props.hint, error: errors[id] })}
      />
    </Field>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mx-auto flex w-full max-w-180 flex-col gap-6"
      noValidate
    >
      <Link
        href={book ? `/admin/books/${book.id}` : "/admin/books"}
        className="-ml-3 inline-flex min-h-11 items-center gap-1 self-start rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
        {book ? "Back to the book" : "Bookshelf"}
      </Link>
      <h1 className="text-title">{book ? "Edit book" : "Add a book"}</h1>

      {text("title", "Title", title, setTitle, { required: true, max: 200 })}
      {text("author", "Author", author, setAuthor, { required: true, max: 200 })}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">Where are we with it?</legend>
        <div className="flex flex-wrap gap-2">
          {BOOK_STATUSES.map((s) => (
            <Chip
              key={s.value}
              size="lg"
              selected={status === s.value}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {text("startedOn", "Started", startedOn, setStartedOn, { type: "date" })}
        {text("finishedOn", "Finished", finishedOn, setFinishedOn, { type: "date" })}
      </div>

      {text("buyUrl", "Where to get it", buyUrl, setBuyUrl, {
        type: "url",
        placeholder: "https://",
        hint: "A link to the publisher or a bookshop, so visitors can buy their own copy.",
        max: 500,
      })}

      <Field
        id="quote"
        label="A line we loved"
        hint="Keep it to a sentence or two. The book is the author's work, so we never post more."
        error={errors.quote}
      >
        <Textarea
          id="quote"
          rows={2}
          maxLength={400}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="font-serif text-quote italic"
          aria-invalid={Boolean(errors.quote) || undefined}
          aria-describedby={describedBy("quote", { hint: true, error: errors.quote })}
        />
      </Field>

      <Field
        id="reflection"
        label="What we're learning"
        hint="In your own words. Shown on the bookshelf when the book is public."
        error={errors.reflection}
      >
        <Textarea
          id="reflection"
          rows={5}
          maxLength={3000}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          aria-invalid={Boolean(errors.reflection) || undefined}
          aria-describedby={describedBy("reflection", { hint: true, error: errors.reflection })}
        />
      </Field>

      <VisibilityToggle
        value={visibility}
        onChange={setVisibility}
        legend="Show on the public bookshelf?"
      />
      <p className="-mt-4 text-caption text-muted">
        {visibility === "public"
          ? "Anyone can see the title, author, link, quote and what you're learning. Reading notes always stay private."
          : "Only the two of you can see this book."}
      </p>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-danger-text">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {book ? (
          <ConfirmDialog
            title="Delete this book?"
            description={
              <>“{book.title}” and all your reading notes on it will be deleted for good.</>
            }
            onConfirm={() => deleteBook(book.id)}
            trigger={(open) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={open}
                className="px-1 text-danger-text hover:text-danger-text"
              >
                <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
                Delete book
              </Button>
            )}
          />
        ) : (
          <span />
        )}
        <Button type="submit" pending={pending}>
          {book ? "Save changes" : "Add to the shelf"}
        </Button>
      </div>
    </form>
  );
}
