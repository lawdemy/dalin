import type { Metadata } from "next";
import { EntryForm, type EntryDraftValues } from "@/components/admin/entry-form";
import type { TiptapDoc } from "@/components/rich-text/rich-text";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";
import { getDraft, getDraftPhotos } from "@/lib/queries/drafts";

export const metadata: Metadata = { title: "New entry" };

export default async function NewEntryPage({ searchParams }: PageProps<"/admin/entries/new">) {
  await requireMember();
  const { date, draft: draftParam } = await searchParams;

  // Reopening a draft from /admin/drafts: ?draft=<id>.
  const saved = typeof draftParam === "string" ? await getDraft(draftParam, "entry") : null;
  if (saved) {
    const p = saved.payload;
    const photos = await getDraftPhotos(p.photos.map((ph) => ph.id));
    const values: EntryDraftValues = {
      title: p.title,
      entryDate: p.entryDate,
      location: p.location,
      mood: p.mood,
      category: p.category,
      body: (p.body as TiptapDoc | null) ?? null,
      visibility: p.visibility,
      photos: photos.map((photo) => ({
        photo,
        caption: p.photos.find((ph) => ph.id === photo.id)?.caption ?? "",
      })),
      coverPhotoId: p.coverPhotoId,
    };
    return <EntryForm key={saved.id} today={todayInDiary()} draft={{ id: saved.id, values }} />;
  }

  // "Write about it" from the calendar passes ?date=yyyy-mm-dd.
  const preset = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  const id = crypto.randomUUID();
  return <EntryForm key={id} today={preset ?? todayInDiary()} draft={{ id }} />;
}
