"use server";

import { addDays, addMonths, format, isWeekend, parseISO } from "date-fns";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import type { TaskRepeat, TaskStatus } from "@/lib/constants";
import { todayInDiary } from "@/lib/format";
import { pushSoon } from "@/lib/push";
import { TASK_COLUMNS } from "@/lib/queries/work";
import { createClient } from "@/lib/supabase/server";
import {
  checklistSchema,
  companySchema,
  projectSchema,
  taskSchema,
  taskStatusSchema,
  type CompanyInput,
  type ProjectInput,
  type TaskInput,
} from "@/lib/validation";

type Db = Awaited<ReturnType<typeof createClient>>;

export type WorkResult = { error?: string; fieldErrors?: Record<string, string>; id?: string };

const SETUP = "The work planner switches on once migration 0014 has been run in Supabase.";
const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

function fieldErrorsOf(issues: z.core.$ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return fieldErrors;
}

// Repeating tasks ---------------------------------------------------------------------

function step(date: Date, repeat: Exclude<TaskRepeat, "none">) {
  if (repeat === "daily") return addDays(date, 1);
  if (repeat === "weekly") return addDays(date, 7);
  if (repeat === "monthly") return addMonths(date, 1);
  let next = addDays(date, 1);
  while (isWeekend(next)) next = addDays(next, 1);
  return next;
}

/** The next due date after today, counted from the old due date (or today). */
function nextDue(due: string | null, repeat: Exclude<TaskRepeat, "none">) {
  const today = todayInDiary();
  let next = step(parseISO(due ?? today), repeat);
  while (format(next, "yyyy-MM-dd") <= today) next = step(next, repeat);
  return format(next, "yyyy-MM-dd");
}

type SavedTask = {
  id: string;
  title: string;
  notes: string | null;
  company_id: string | null;
  project_id: string | null;
  assignee_id: string | null;
  priority: string;
  due_date: string | null;
  repeat: TaskRepeat;
  checklist: { text: string; done: boolean }[] | null;
};

/** When a repeating task is finished, adds the next one and stops this one repeating. */
async function repeatTask(db: Db, t: SavedTask) {
  if (t.repeat === "none") return;
  const { error } = await db.from("tasks").insert({
    title: t.title,
    notes: t.notes,
    company_id: t.company_id,
    project_id: t.project_id,
    assignee_id: t.assignee_id,
    priority: t.priority,
    due_date: nextDue(t.due_date, t.repeat),
    repeat: t.repeat,
    checklist: (t.checklist ?? []).map((item) => ({ text: item.text, done: false })),
  });
  if (error) {
    console.error(`Couldn't add the next "${t.title}"`, error);
    return;
  }
  await db.from("tasks").update({ repeat: "none" }).eq("id", t.id);
}

async function currentStatus(db: Db, id: string): Promise<TaskStatus | null> {
  const { data } = await db.from("tasks").select("status").eq("id", id).maybeSingle();
  return (data?.status as TaskStatus | undefined) ?? null;
}

// Tasks ---------------------------------------------------------------------------------

/** Adds a task, or with an id updates it. Either of us may change any task. */
export async function saveTask(input: TaskInput): Promise<WorkResult> {
  await requireMember();
  pushSoon();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success)
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  const { id, ...t } = parsed.data;
  const row = {
    title: t.title,
    notes: t.notes,
    company_id: t.companyId,
    project_id: t.projectId,
    assignee_id: t.assigneeId,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate,
    repeat: t.repeat,
    checklist: t.checklist,
  };

  const db = await createClient();
  let before: TaskStatus | null = null;
  if (id) {
    before = await currentStatus(db, id);
    if (!before) return { error: "That task no longer exists." };
  }
  const { data, error } = id
    ? await db.from("tasks").update(row).eq("id", id).select(TASK_COLUMNS)
    : await db.from("tasks").insert(row).select(TASK_COLUMNS);
  if (missingTable(error?.code)) return { error: SETUP };
  if (error?.code === "23503")
    return { error: "That business, project or person no longer exists. Pick another." };
  if (error || !data?.length) return { error: "Couldn't save the task. Try again." };

  const saved = data[0] as SavedTask & { status: TaskStatus };
  if (saved.status === "done" && before !== "done") await repeatTask(db, saved);
  return { id: saved.id };
}

/** Ticks a task off, or moves it between pending and in progress. */
export async function setTaskStatus(id: string, status: TaskStatus): Promise<WorkResult> {
  await requireMember();
  pushSoon();
  if (!z.uuid().safeParse(id).success || !taskStatusSchema.safeParse(status).success)
    return { error: "That task couldn't be found." };
  const db = await createClient();
  const before = await currentStatus(db, id);
  if (!before) return { error: "That task no longer exists." };
  const { data, error } = await db
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select(TASK_COLUMNS);
  if (error || !data?.length) return { error: "Couldn't update the task. Try again." };
  if (status === "done" && before !== "done") await repeatTask(db, data[0] as SavedTask);
  return {};
}

/** Saves a task's checklist straight away (ticking a step needs no Save). */
export async function saveChecklist(id: string, checklist: unknown): Promise<WorkResult> {
  await requireMember();
  const parsed = checklistSchema.safeParse(checklist);
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return { error: "Couldn't save the checklist." };
  const db = await createClient();
  const { data, error } = await db
    .from("tasks")
    .update({ checklist: parsed.data })
    .eq("id", id)
    .select("id");
  return error || !data?.length ? { error: "Couldn't save the checklist. Try again." } : {};
}

export async function deleteTask(id: string) {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return;
  const db = await createClient();
  const { error } = await db.from("tasks").delete().eq("id", id);
  if (error) throw new Error("Couldn't delete the task. Try again.");
  redirect("/admin/work");
}

// Businesses and projects -------------------------------------------------------------------

const DUPLICATE_COMPANY = "You already have a business with that name.";
const DUPLICATE_PROJECT = "This business already has a project with that name.";

export async function saveCompany(input: CompanyInput): Promise<WorkResult> {
  await requireMember();
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, name, color } = parsed.data;
  const db = await createClient();
  const { data, error } = id
    ? await db.from("work_companies").update({ name, color }).eq("id", id).select("id")
    : await db.from("work_companies").insert({ name, color }).select("id");
  if (missingTable(error?.code)) return { error: SETUP };
  if (error?.code === "23505") return { error: DUPLICATE_COMPANY };
  if (error || !data?.length) return { error: "Couldn't save the business. Try again." };
  return { id: data[0].id };
}

export async function setCompanyArchived(id: string, archived: boolean): Promise<WorkResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That business couldn't be found." };
  const db = await createClient();
  const { error } = await db.from("work_companies").update({ archived }).eq("id", id);
  return error ? { error: "Couldn't update the business. Try again." } : {};
}

/** Deletes a business and its projects; its tasks stay, without a business. */
export async function deleteCompany(id: string): Promise<WorkResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That business couldn't be found." };
  const db = await createClient();
  const { error } = await db.from("work_companies").delete().eq("id", id);
  return error ? { error: "Couldn't delete the business. Try again." } : {};
}

export async function saveProject(input: ProjectInput): Promise<WorkResult> {
  await requireMember();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, companyId, name } = parsed.data;
  const db = await createClient();
  const { data, error } = id
    ? await db.from("work_projects").update({ name }).eq("id", id).select("id")
    : await db.from("work_projects").insert({ company_id: companyId, name }).select("id");
  if (missingTable(error?.code)) return { error: SETUP };
  if (error?.code === "23505") return { error: DUPLICATE_PROJECT };
  if (error || !data?.length) return { error: "Couldn't save the project. Try again." };
  return { id: data[0].id };
}

export async function setProjectArchived(id: string, archived: boolean): Promise<WorkResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That project couldn't be found." };
  const db = await createClient();
  const { error } = await db.from("work_projects").update({ archived }).eq("id", id);
  return error ? { error: "Couldn't update the project. Try again." } : {};
}

/** Deletes a project; its tasks stay under the business. */
export async function deleteProject(id: string): Promise<WorkResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return { error: "That project couldn't be found." };
  const db = await createClient();
  const { error } = await db.from("work_projects").delete().eq("id", id);
  return error ? { error: "Couldn't delete the project. Try again." } : {};
}
