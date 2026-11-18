import "server-only";
import { requireMember } from "@/lib/auth";
import type { TaskPriority, TaskRepeat, TaskStatus } from "@/lib/constants";
import { todayInDiary } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type WorkCompany = { id: string; name: string; color: number; archived: boolean };
export type WorkProject = { id: string; companyId: string; name: string; archived: boolean };
export type WorkPerson = { id: string; name: string };
export type ChecklistItem = { text: string; done: boolean };

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  companyId: string | null;
  projectId: string | null;
  /** Null: for both of us. */
  assigneeId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  repeat: TaskRepeat;
  checklist: ChecklistItem[];
  /** The diary-time-zone day it was finished (yyyy-mm-dd). */
  doneOn: string | null;
  doneById: string | null;
};

export type WorkLists = {
  companies: WorkCompany[];
  projects: WorkProject[];
  people: WorkPerson[];
  setupNeeded?: boolean;
};

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  company_id: string | null;
  project_id: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  repeat: TaskRepeat;
  checklist: unknown;
  done_at: string | null;
  done_by: string | null;
};

export const TASK_COLUMNS =
  "id, title, notes, company_id, project_id, assignee_id, status, priority, due_date, repeat, checklist, done_at, done_by";

/** How far back the Done view reaches. */
const DONE_DAYS = 60;

/** True for "relation doesn't exist" (migration 0014 not run yet). */
const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

function toChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    item && typeof item === "object" && typeof (item as ChecklistItem).text === "string"
      ? [{ text: (item as ChecklistItem).text, done: (item as ChecklistItem).done === true }]
      : [],
  );
}

export function toTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes,
    companyId: r.company_id,
    projectId: r.project_id,
    assigneeId: r.assignee_id,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date,
    repeat: r.repeat,
    checklist: toChecklist(r.checklist),
    doneOn: r.done_at ? todayInDiary(new Date(r.done_at)) : null,
    doneById: r.done_by,
  };
}

/** Businesses, projects and the two of us. `setupNeeded` until migration 0014 runs. */
export async function getWorkLists(): Promise<WorkLists> {
  await requireMember();
  const db = await createClient();
  const [companies, projects, people] = await Promise.all([
    db.from("work_companies").select("id, name, color, archived").order("name"),
    db.from("work_projects").select("id, company_id, name, archived").order("name"),
    db.from("profiles").select("id, display_name").order("created_at"),
  ]);
  if (people.error) throw new Error(`Couldn't load profiles: ${people.error.message}`);
  const persons = (people.data ?? []).map((p) => ({ id: p.id, name: p.display_name }));
  const error = companies.error ?? projects.error;
  if (error) {
    if (missingTable(error.code))
      return { companies: [], projects: [], people: persons, setupNeeded: true };
    throw new Error(`Couldn't load businesses: ${error.message}`);
  }
  return {
    people: persons,
    companies: (companies.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      archived: c.archived,
    })),
    projects: (projects.data ?? []).map((p) => ({
      id: p.id,
      companyId: p.company_id,
      name: p.name,
      archived: p.archived,
    })),
  };
}

/** Every open task, plus those finished in the last DONE_DAYS days. */
export async function getWork(): Promise<WorkLists & { tasks: Task[] }> {
  const lists = await getWorkLists();
  if (lists.setupNeeded) return { ...lists, tasks: [] };
  const db = await createClient();
  const since = new Date(Date.now() - DONE_DAYS * 86_400_000).toISOString();
  const [open, done] = await Promise.all([
    db.from("tasks").select(TASK_COLUMNS).neq("status", "done").limit(2000),
    db
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("status", "done")
      .gte("done_at", since)
      .order("done_at", { ascending: false })
      .limit(1000),
  ]);
  const error = open.error ?? done.error;
  if (error) throw new Error(`Couldn't load tasks: ${error.message}`);
  return {
    ...lists,
    tasks: [...((open.data ?? []) as TaskRow[]), ...((done.data ?? []) as TaskRow[])].map(toTask),
  };
}

export async function getTask(id: string): Promise<Task | null> {
  await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createClient();
  const { data, error } = await db.from("tasks").select(TASK_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    if (missingTable(error.code)) return null;
    throw new Error(`Couldn't load the task: ${error.message}`);
  }
  return data ? toTask(data as TaskRow) : null;
}

/** For the dashboard: my open tasks (and shared ones) due today or earlier. */
export async function countMyWorkToday(): Promise<{ due: number; overdue: number }> {
  const me = await requireMember();
  const db = await createClient();
  const today = todayInDiary();
  const { data, error } = await db
    .from("tasks")
    .select("due_date, status")
    .neq("status", "done")
    .or(`assignee_id.eq.${me.id},assignee_id.is.null`)
    .lte("due_date", today);
  if (error) return { due: 0, overdue: 0 };
  return {
    due: data?.length ?? 0,
    overdue: (data ?? []).filter((t) => t.due_date < today).length,
  };
}
