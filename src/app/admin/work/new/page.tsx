import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TaskForm } from "@/components/admin/task-form";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";
import { getWorkLists } from "@/lib/queries/work";

export const metadata: Metadata = { title: "New task" };

export default async function NewTaskPage() {
  const me = await requireMember();
  const { companies, projects, people, setupNeeded } = await getWorkLists();
  if (setupNeeded) redirect("/admin/work");
  return (
    <TaskForm
      companies={companies}
      projects={projects}
      people={people}
      meId={me.id}
      today={todayInDiary()}
    />
  );
}
