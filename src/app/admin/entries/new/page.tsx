import type { Metadata } from "next";
import { EntryForm } from "@/components/admin/entry-form";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";

export const metadata: Metadata = { title: "New entry" };

export default async function NewEntryPage() {
  await requireMember();
  return <EntryForm today={todayInDiary()} />;
}
