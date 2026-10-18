import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/admin/book-form";
import { getBook } from "@/lib/queries/books";

export const metadata: Metadata = { title: "Edit book" };

export default async function EditBookPage({ params }: PageProps<"/admin/books/[id]/edit">) {
  const { id } = await params;
  const book = await getBook(id); // checks membership
  if (!book) notFound();
  return <BookForm book={book} />;
}
