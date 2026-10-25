import type { Metadata } from "next";
import { DraftList } from "@/components/admin/draft-list";
import { listDrafts } from "@/lib/queries/drafts";

export const metadata: Metadata = { title: "Drafts" };

/** Everything I started writing and haven't sent yet. Only I can see these. */
export default async function DraftsPage() {
  const drafts = await listDrafts(); // checks membership
  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-title">Drafts</h1>
        <p className="text-muted">
          Anything you start writing is saved here automatically until you send it. Only you can see
          your drafts.
        </p>
      </div>
      <DraftList drafts={drafts} now={new Date().toISOString()} />
    </div>
  );
}
