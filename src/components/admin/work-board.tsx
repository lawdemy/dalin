"use client";

import { addDays, format, parseISO } from "date-fns";
import { Check, Flag, ListChecks, Plus, Repeat, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { saveTask, setTaskStatus } from "@/app/admin/work/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { COMPANY_COLORS, PRIORITY_RANK, type TaskStatus } from "@/lib/constants";
import type { Task, WorkCompany, WorkPerson, WorkProject } from "@/lib/queries/work";
import { cn } from "@/lib/utils";

type WorkBoardProps = {
  tasks: Task[];
  companies: WorkCompany[];
  projects: WorkProject[];
  people: WorkPerson[];
  meId: string;
  /** yyyy-mm-dd in the diary's time zone, from the server. */
  today: string;
};

type View = "today" | "upcoming" | "open" | "done";

const VIEWS: { value: View; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "open", label: "All open" },
  { value: "done", label: "Done" },
];

/** Status changes shown before the server confirms them (only while `from` is current). */
type Override = { from: TaskStatus; to: TaskStatus };

export function WorkBoard({ tasks, companies, projects, people, meId, today }: WorkBoardProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("today");
  const [person, setPerson] = useState("all");
  const [company, setCompany] = useState("all");
  const [project, setProject] = useState("all");
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [error, setError] = useState<string>();
  const [quickTitle, setQuickTitle] = useState("");
  const [adding, startAdding] = useTransition();
  const [, startUpdate] = useTransition();

  const statusOf = (t: Task) => {
    const o = overrides[t.id];
    return o && o.from === t.status ? o.to : t.status;
  };
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const nameOf = (id: string | null) =>
    id === null
      ? "Both of you"
      : id === meId
        ? "You"
        : (people.find((p) => p.id === id)?.name ?? "");

  // Filters (everything but the view).
  const q = query.trim().toLowerCase();
  const filtered = tasks.filter(
    (t) =>
      (person === "all" || t.assigneeId === person || t.assigneeId === null) &&
      (company === "all" || (company === "none" ? !t.companyId : t.companyId === company)) &&
      (project === "all" || t.projectId === project) &&
      (!q || t.title.toLowerCase().includes(q) || (t.notes ?? "").toLowerCase().includes(q)),
  );
  const open = filtered.filter((t) => statusOf(t) !== "done");
  const justDone = (t: Task) =>
    statusOf(t) === "done" && (t.doneOn === today || t.status !== "done");

  const stats = {
    overdue: open.filter((t) => t.dueDate && t.dueDate < today).length,
    dueToday: open.filter((t) => t.dueDate === today).length,
    inProgress: open.filter((t) => statusOf(t) === "in_progress").length,
    doneToday: filtered.filter(justDone).length,
  };

  function changeStatus(task: Task, to: TaskStatus) {
    setError(undefined);
    setOverrides((all) => ({ ...all, [task.id]: { from: task.status, to } }));
    startUpdate(async () => {
      const res = await setTaskStatus(task.id, to);
      if (res.error) {
        setOverrides((all) => {
          const rest = { ...all };
          delete rest[task.id];
          return rest;
        });
        setError(res.error);
      }
      router.refresh();
    });
  }

  function quickAdd() {
    const title = quickTitle.trim();
    if (!title) return;
    setError(undefined);
    startAdding(async () => {
      const res = await saveTask({
        title,
        notes: "",
        companyId: company !== "all" && company !== "none" ? company : null,
        projectId: project !== "all" ? project : null,
        assigneeId: person === "all" ? meId : person,
        status: "pending",
        priority: "normal",
        dueDate: view === "today" ? today : view === "upcoming" ? tomorrow(today) : "",
        repeat: "none",
        checklist: [],
      });
      if (res.error) setError(res.error);
      else {
        setQuickTitle("");
        router.refresh();
      }
    });
  }

  const row = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      status={statusOf(t)}
      today={today}
      who={nameOf(t.assigneeId)}
      project={t.projectId ? projectById.get(t.projectId)?.name : undefined}
      onStatus={(to) => changeStatus(t, to)}
    />
  );

  // What the chosen view lists, in groups.
  let groups: { key: string; heading: ReactNode; items: Task[] }[] = [];
  if (view === "today" || view === "open") {
    const items =
      view === "today"
        ? [
            ...open.filter(
              (t) => (t.dueDate && t.dueDate <= today) || statusOf(t) === "in_progress",
            ),
            ...filtered.filter(justDone),
          ]
        : open;
    groups = byCompany(items, companies).map(({ id, items }) => {
      const c = id ? companyById.get(id) : undefined;
      return {
        key: id ?? "none",
        heading: (
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "size-3 shrink-0 rounded-full",
                c ? COMPANY_COLORS[c.color] : "bg-sand",
              )}
            />
            {c?.name ?? "No business"}
          </span>
        ),
        items: sortTasks(items, statusOf),
      };
    });
  } else if (view === "upcoming") {
    const items = open.filter((t) => t.dueDate && t.dueDate > today);
    groups = groupBy(items, (t) => t.dueDate!)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, items }) => ({
        key,
        heading: dayLabel(key, today),
        items: sortTasks(items, statusOf),
      }));
  } else {
    const items = filtered.filter((t) => statusOf(t) === "done");
    groups = groupBy(items, (t) => t.doneOn ?? today)
      .sort((a, b) => b.key.localeCompare(a.key))
      .map(({ key, items }) => ({ key, heading: dayLabel(key, today), items }));
  }

  const partnerFirst = [...people].sort((a, b) => Number(b.id === meId) - Number(a.id === meId));
  const companyProjects = projects.filter(
    (p) => p.companyId === company && (!p.archived || p.id === project),
  );

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="At a glance" className="grid grid-cols-4 gap-2">
        <Stat value={stats.overdue} label="overdue" alert={stats.overdue > 0} />
        <Stat value={stats.dueToday} label="due today" />
        <Stat value={stats.inProgress} label="in progress" />
        <Stat value={stats.doneToday} label="done today" />
      </section>

      <div role="group" aria-label="View" className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Chip key={v.value} selected={view === v.value} onClick={() => setView(v.value)}>
            {v.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Whose work" className="flex flex-wrap gap-2">
          <Chip selected={person === "all"} onClick={() => setPerson("all")}>
            Everyone
          </Chip>
          {partnerFirst.map((p) => (
            <Chip key={p.id} selected={person === p.id} onClick={() => setPerson(p.id)}>
              {p.id === meId ? `${p.name} (you)` : p.name}
            </Chip>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Select
            aria-label="Business"
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              setProject("all");
            }}
          >
            <option value="all">All businesses</option>
            {companies
              .filter((c) => !c.archived || c.id === company)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            <option value="none">No business</option>
          </Select>
          {companyProjects.length > 0 && (
            <Select
              aria-label="Project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="all">All projects</option>
              {companyProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted"
              strokeWidth={1.8}
            />
            <Input
              type="search"
              aria-label="Search tasks"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {view !== "done" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            quickAdd();
          }}
          className="flex gap-2"
        >
          <Input
            aria-label="New task"
            placeholder={
              view === "today"
                ? "Add a task for today"
                : view === "upcoming"
                  ? "Add a task for tomorrow"
                  : "Add a task"
            }
            value={quickTitle}
            maxLength={300}
            onChange={(e) => setQuickTitle(e.target.value)}
          />
          <Button type="submit" pending={adding} aria-label="Add task" className="w-12 px-0">
            {!adding && <Plus aria-hidden className="size-5" strokeWidth={2} />}
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-danger-text">
          {error}
        </p>
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={
            view === "today"
              ? "Nothing due today"
              : view === "done"
                ? "Nothing finished yet"
                : "No tasks here"
          }
          description={
            tasks.length === 0
              ? "Add your businesses, then your first task."
              : view === "today"
                ? "Enjoy it, or pull something forward from Upcoming."
                : "Try another view or filter."
          }
          action={
            tasks.length === 0 ? (
              <Link href="/admin/work/companies" className="text-label font-medium">
                Add your businesses
              </Link>
            ) : undefined
          }
        />
      ) : (
        groups.map((g) => (
          <section key={g.key} className="flex flex-col">
            <h2 className="flex items-center justify-between gap-2 border-b border-sand pb-2 text-label font-semibold text-ink">
              {g.heading}
              <span className="text-caption font-medium text-muted">{g.items.length}</span>
            </h2>
            <ul className="flex flex-col divide-y divide-divider">{g.items.map(row)}</ul>
          </section>
        ))
      )}
    </div>
  );
}

function Stat({ value, label, alert }: { value: number; label: string; alert?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-linen px-1 py-2.5 text-center">
      <span
        className={cn(
          "font-serif text-[1.75rem] leading-none font-semibold",
          alert ? "text-danger-text" : "text-ink",
        )}
      >
        {value}
      </span>
      <span className="mt-1 text-micro text-muted">{label}</span>
    </div>
  );
}

type TaskRowProps = {
  task: Task;
  status: TaskStatus;
  today: string;
  who: string;
  project?: string;
  onStatus: (to: TaskStatus) => void;
};

function TaskRow({ task, status, today, who, project, onStatus }: TaskRowProps) {
  const done = status === "done";
  const started = status === "in_progress";
  const steps = task.checklist.length;
  const stepsDone = task.checklist.filter((s) => s.done).length;
  const overdue = !done && task.dueDate !== null && task.dueDate < today;

  return (
    <li className="flex items-start gap-1">
      <button
        type="button"
        onClick={() => onStatus(done ? "pending" : "done")}
        aria-label={done ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}
        aria-pressed={done}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
            done
              ? "border-accent-dark bg-accent-dark text-white"
              : started
                ? "border-accent-dark"
                : "border-line hover:border-accent-dark",
          )}
        >
          {done && <Check aria-hidden className="size-4" strokeWidth={3} />}
          {started && <span aria-hidden className="size-2.5 rounded-full bg-accent-dark" />}
        </span>
      </button>

      <Link
        href={`/admin/work/${task.id}`}
        className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 text-ink no-underline hover:text-ink"
      >
        <span className={cn("wrap-break-word", done && "text-muted line-through")}>
          {task.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-caption text-muted">
          {(task.priority === "urgent" || task.priority === "high") && !done && (
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                task.priority === "urgent" ? "text-danger-text" : "text-accent-dark",
              )}
            >
              <Flag aria-hidden className="size-3.5" strokeWidth={2} />
              {task.priority === "urgent" ? "Urgent" : "High"}
            </span>
          )}
          {task.dueDate && !done && (
            <span className={cn(overdue && "font-medium text-danger-text")}>
              {overdue
                ? `Overdue · ${dayLabel(task.dueDate, today)}`
                : dayLabel(task.dueDate, today)}
            </span>
          )}
          <span>{who}</span>
          {project && <span>{project}</span>}
          {steps > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks aria-hidden className="size-3.5" strokeWidth={1.8} />
              {stepsDone}/{steps}
            </span>
          )}
          {task.repeat !== "none" && (
            <Repeat aria-label="Repeats" className="size-3.5" strokeWidth={1.8} />
          )}
        </span>
      </Link>

      {!done && (
        <button
          type="button"
          onClick={() => onStatus(started ? "pending" : "in_progress")}
          aria-label={
            started
              ? `“${task.title}” is in progress. Mark it pending`
              : `“${task.title}” is pending. Mark it in progress`
          }
          className="flex h-11 shrink-0 items-center"
        >
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-micro font-semibold whitespace-nowrap",
              started ? "bg-rose-tint text-accent-deep" : "bg-linen text-muted",
            )}
          >
            {started ? "In progress" : "Pending"}
          </span>
        </button>
      )}
    </li>
  );
}

// Helpers -----------------------------------------------------------------------------------

function tomorrow(today: string) {
  return format(addDays(parseISO(today), 1), "yyyy-MM-dd");
}

/** "Today", "Tomorrow", "Yesterday" or "Wed 4 Nov". */
export function dayLabel(date: string, today: string) {
  if (date === today) return "Today";
  if (date === tomorrow(today)) return "Tomorrow";
  if (date === format(addDays(parseISO(today), -1), "yyyy-MM-dd")) return "Yesterday";
  return format(
    parseISO(date),
    date.slice(0, 4) === today.slice(0, 4) ? "EEE d MMM" : "d MMM yyyy",
  );
}

function groupBy(items: Task[], key: (t: Task) => string) {
  const map = new Map<string, Task[]>();
  for (const t of items) map.set(key(t), [...(map.get(key(t)) ?? []), t]);
  return [...map].map(([key, items]) => ({ key, items }));
}

/** Groups by business in A–Z order, tasks without one last. */
function byCompany(items: Task[], companies: WorkCompany[]) {
  const order = new Map(companies.map((c, i) => [c.id, i]));
  return groupBy(items, (t) => t.companyId ?? "")
    .sort((a, b) => (order.get(a.key) ?? 1e9) - (order.get(b.key) ?? 1e9))
    .map(({ key, items }) => ({ id: key || null, items }));
}

/** Open first; then earliest due, highest priority, title. */
function sortTasks(items: Task[], statusOf: (t: Task) => TaskStatus) {
  return [...items].sort(
    (a, b) =>
      Number(statusOf(a) === "done") - Number(statusOf(b) === "done") ||
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.title.localeCompare(b.title),
  );
}
