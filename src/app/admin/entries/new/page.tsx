import type { Metadata } from "next";
import { EntryForm } from "@/components/admin/entry-form";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";

export const metadata: Metadata = { title: "New entry" };

export default async function NewEntryPage({ searchParams }: PageProps<"/admin/entries/new">) {
  await requireMember();
  // "Write about it" from the calendar passes ?date=yyyy-mm-dd.
  const { date } = await searchParams;
  const preset = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  return <EntryForm today={preset ?? todayInDiary()} />;
}
