import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { VisionBoard } from "@/components/admin/vision-board";
import { buttonClasses } from "@/components/ui/button";
import { requireMember } from "@/lib/auth";
import { listVisions } from "@/lib/queries/visions";

export const metadata: Metadata = { title: "Vision board" };

export default async function VisionBoardPage() {
  const me = await requireMember();
  const { visions, people, setupNeeded } = await listVisions();

  return (
    <div className="mx-auto flex w-full max-w-240 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title">Vision board</h1>
        {!setupNeeded && (
          <Link href="/admin/vision/new" className={buttonClasses({ size: "sm" })}>
            <Plus aria-hidden className="size-4.5" strokeWidth={2} />
            Add a vision
          </Link>
        )}
      </div>
      <p className="-mt-3 text-muted">
        What you&rsquo;re each reaching for, and what you&rsquo;re building as a family, in any area
        of life. Only the two of you can see this.
      </p>

      {setupNeeded ? (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          The vision board switches on once migration 0013 has been run in Supabase.
        </p>
      ) : (
        <VisionBoard visions={visions} people={people} meId={me.id} />
      )}
    </div>
  );
}
