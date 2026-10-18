import type { Metadata } from "next";
import { BookForm } from "@/components/admin/book-form";
import { requireMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Add a book" };

export default async function NewBookPage() {
  await requireMember();
  return <BookForm />;
}
