import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/admin/task-form";
import { requireMember } from "@/lib/auth";
import { todayInDiary } from "@/lib/format";
import { getTask, getWorkLists } from "@/lib/queries/work";

export const metadata: Metadata = { title: "Task" };

export default async function TaskPage({ params }: PageProps<"/admin/work/[id]">) {
  const { id } = await params;
  const me = await requireMember();
  const [task, { companies, projects, people }] = await Promise.all([getTask(id), getWorkLists()]);
  if (!task) notFound();
  return (
    <TaskForm
      key={task.id}
      task={task}
      companies={companies}
      projects={projects}
      people={people}
      meId={me.id}
      today={todayInDiary()}
    />
  );
}
