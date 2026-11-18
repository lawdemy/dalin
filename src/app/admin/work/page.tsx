import { Briefcase, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { WorkBoard } from "@/components/admin/work-board";
import { buttonClasses } from "@/components/ui/button";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";
import { getWork } from "@/lib/queries/work";

export const metadata: Metadata = { title: "Work" };

export default async function WorkPage() {
  const me = await requireMember();
  const { tasks, companies, projects, people, setupNeeded } = await getWork();

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title">Work</h1>
        {!setupNeeded && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/work/companies"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              <Briefcase aria-hidden className="size-4" strokeWidth={1.8} />
              Businesses
            </Link>
            <Link href="/admin/work/new" className={buttonClasses({ size: "sm" })}>
              <Plus aria-hidden className="size-4.5" strokeWidth={2} />
              New task
            </Link>
          </div>
        )}
      </div>

      {setupNeeded ? (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          The work planner switches on once migration 0014 has been run in Supabase.
        </p>
      ) : (
        <WorkBoard
          tasks={tasks}
          companies={companies}
          projects={projects}
          people={people}
          meId={me.id}
          today={todayInDiary()}
        />
      )}
    </div>
  );
}
