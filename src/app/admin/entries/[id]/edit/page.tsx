import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryForm } from "@/components/admin/entry-form";
import { todayInDiary } from "@/lib/format";
import { getEntry } from "@/lib/queries/entries";

export const metadata: Metadata = { title: "Edit entry" };

export default async function EditEntryPage({ params }: PageProps<"/admin/entries/[id]/edit">) {
  const { id } = await params;
  const entry = await getEntry(id); // checks membership
  if (!entry) notFound();
  return <EntryForm entry={entry} today={todayInDiary()} />;
}
