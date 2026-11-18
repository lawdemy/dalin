"use client";

import { addDays, format, parseISO } from "date-fns";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTask, saveChecklist, saveTask } from "@/app/admin/work/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  TASK_PRIORITIES,
  TASK_REPEATS,
  TASK_STATUSES,
  type TaskPriority,
  type TaskRepeat,
  type TaskStatus,
} from "@/lib/constants";
import type { ChecklistItem, Task, WorkCompany, WorkPerson, WorkProject } from "@/lib/queries/work";
import { cn } from "@/lib/utils";

type TaskFormProps = {
  /** The task being edited; omit for a new one. */
  task?: Task;
  companies: WorkCompany[];
  projects: WorkProject[];
  people: WorkPerson[];
  meId: string;
  today: string;
  /** Starting values for a new task (from the link that opened the form). */
  defaults?: { companyId?: string; projectId?: string; dueDate?: string };
};

export function TaskForm({
  task,
  companies,
  projects,
  people,
  meId,
  today,
  defaults,
}: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pending");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "normal");
  const [companyId, setCompanyId] = useState(
    task ? (task.companyId ?? "") : (defaults?.companyId ?? ""),
  );
  const [projectId, setProjectId] = useState(
    task ? (task.projectId ?? "") : (defaults?.projectId ?? ""),
  );
  const [assigneeId, setAssigneeId] = useState<string | null>(task ? task.assigneeId : meId);
  const [dueDate, setDueDate] = useState(
    task ? (task.dueDate ?? "") : (defaults?.dueDate ?? today),
  );
  const [repeat, setRepeat] = useState<TaskRepeat>(task?.repeat ?? "none");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task?.checklist ?? []);
  const [newStep, setNewStep] = useState("");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const day = (n: number) => format(addDays(parseISO(today), n), "yyyy-MM-dd");
  const dueChips = [
    { label: "Today", value: today },
    { label: "Tomorrow", value: day(1) },
    { label: "In a week", value: day(7) },
    { label: "No date", value: "" },
  ];
  const companyOptions = companies.filter((c) => !c.archived || c.id === companyId);
  const projectOptions = projects.filter(
    (p) => p.companyId === companyId && (!p.archived || p.id === projectId),
  );

  // Ticking a step on a saved task saves at once; other changes wait for Save.
  function updateChecklist(next: ChecklistItem[], saveNow = false) {
    setChecklist(next);
    if (saveNow && task) {
      void saveChecklist(
        task.id,
        next.filter((s) => s.text.trim()),
      ).then((res) => res.error && setError(res.error));
    }
  }

  function addStep() {
    const text = newStep.trim();
    if (!text || checklist.length >= 50) return;
    updateChecklist([...checklist, { text, done: false }]);
    setNewStep("");
  }

  function save() {
    setError(undefined);
    setErrors({});
    const steps = [...checklist, ...(newStep.trim() ? [{ text: newStep, done: false }] : [])];
    startTransition(async () => {
      const res = await saveTask({
        id: task?.id,
        title,
        notes,
        companyId: companyId || null,
        projectId: projectId || null,
        assigneeId,
        status,
        priority,
        dueDate,
        repeat,
        checklist: steps.filter((s) => s.text.trim()),
      });
      if (res.error) {
        setError(res.error);
        setErrors(res.fieldErrors ?? {});
      } else {
        router.push("/admin/work");
        router.refresh();
      }
    });
  }

  const sortedPeople = [...people].sort((a, b) => Number(b.id === meId) - Number(a.id === meId));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mx-auto flex w-full max-w-180 flex-col gap-6"
      noValidate
    >
      <Link
        href="/admin/work"
        className="-ml-3 inline-flex min-h-11 items-center gap-1 self-start rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
        Work
      </Link>
      <h1 className="text-title">{task ? "Task" : "New task"}</h1>

      <Field id="title" label="What needs doing" required error={errors.title}>
        <Input
          id="title"
          value={title}
          maxLength={300}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title) || undefined}
          aria-describedby={describedBy("title", { error: errors.title })}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">Status</legend>
        <div className="flex flex-wrap gap-2">
          {TASK_STATUSES.map((s) => (
            <Chip
              key={s.value}
              size="lg"
              selected={status === s.value}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="company"
          label="Business"
          hint={<Link href="/admin/work/companies">Add or edit businesses</Link>}
        >
          <Select
            id="company"
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              setProjectId("");
            }}
            aria-describedby="company-hint"
          >
            <option value="">No business</option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="project" label="Project" error={errors.projectId}>
          <Select
            id="project"
            value={projectId}
            disabled={!companyId || projectOptions.length === 0}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">
              {!companyId
                ? "Pick a business first"
                : projectOptions.length
                  ? "No project"
                  : "No projects yet"}
            </option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">Who&rsquo;s doing it</legend>
        <div className="flex flex-wrap gap-2">
          {sortedPeople.map((p) => (
            <Chip
              key={p.id}
              size="lg"
              selected={assigneeId === p.id}
              onClick={() => setAssigneeId(p.id)}
            >
              {p.id === meId ? `${p.name} (you)` : p.name}
            </Chip>
          ))}
          <Chip size="lg" selected={assigneeId === null} onClick={() => setAssigneeId(null)}>
            Both of us
          </Chip>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">Priority</legend>
        <div className="flex flex-wrap gap-2">
          {TASK_PRIORITIES.map((p) => (
            <Chip
              key={p.value}
              size="lg"
              selected={priority === p.value}
              onClick={() => setPriority(p.value)}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Field id="dueDate" label="Due" error={errors.dueDate}>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-invalid={Boolean(errors.dueDate) || undefined}
            aria-describedby={describedBy("dueDate", { error: errors.dueDate })}
          />
        </Field>
        <div role="group" aria-label="Quick dates" className="flex flex-wrap gap-2">
          {dueChips.map((c) => (
            <Chip key={c.label} selected={dueDate === c.value} onClick={() => setDueDate(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <Field
        id="repeat"
        label="Repeat"
        hint={
          repeat === "none"
            ? undefined
            : "When it's ticked off, the next one is added with the next due date."
        }
      >
        <Select
          id="repeat"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
          aria-describedby={repeat === "none" ? undefined : "repeat-hint"}
        >
          {TASK_REPEATS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>

      <section aria-labelledby="steps-label" className="flex flex-col gap-2">
        <span id="steps-label" className="text-label font-medium">
          Checklist
          {checklist.length > 0 && (
            <span className="font-normal text-muted">
              {" "}
              · {checklist.filter((s) => s.done).length} of {checklist.length} done
            </span>
          )}
        </span>
        {checklist.length > 0 && (
          <ul className="flex flex-col divide-y divide-divider">
            {checklist.map((step, i) => (
              <li key={i} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={step.done}
                  aria-label={`Step ${i + 1} done`}
                  onChange={(e) =>
                    updateChecklist(
                      checklist.map((s, j) => (j === i ? { ...s, done: e.target.checked } : s)),
                      true,
                    )
                  }
                  className="m-3 size-5 shrink-0 accent-accent-dark"
                />
                <input
                  aria-label={`Step ${i + 1}`}
                  value={step.text}
                  maxLength={200}
                  onChange={(e) =>
                    updateChecklist(
                      checklist.map((s, j) => (j === i ? { ...s, text: e.target.value } : s)),
                    )
                  }
                  className={cn(
                    "h-11 min-w-0 flex-1 bg-transparent text-body",
                    step.done && "text-muted line-through",
                  )}
                />
                <button
                  type="button"
                  aria-label={`Remove step ${i + 1}`}
                  onClick={() => updateChecklist(checklist.filter((_, j) => j !== i))}
                  className="flex size-11 shrink-0 items-center justify-center text-muted hover:text-danger-text"
                >
                  <X aria-hidden className="size-4.5" strokeWidth={1.8} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            aria-label="New step"
            placeholder="Add a step"
            value={newStep}
            maxLength={200}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStep();
              }
            }}
          />
          <Button variant="secondary" aria-label="Add step" onClick={addStep} className="w-12 px-0">
            <Plus aria-hidden className="size-5" strokeWidth={2} />
          </Button>
        </div>
        {errors.checklist && <p className="text-caption text-danger-text">{errors.checklist}</p>}
      </section>

      <Field id="notes" label="Notes" error={errors.notes}>
        <Textarea
          id="notes"
          rows={4}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-invalid={Boolean(errors.notes) || undefined}
          aria-describedby={describedBy("notes", { error: errors.notes })}
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-danger-text">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {task ? (
          <ConfirmDialog
            title="Delete this task?"
            description={<>“{task.title}” will be deleted for good.</>}
            onConfirm={() => deleteTask(task.id)}
            trigger={(open) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={open}
                className="px-1 text-danger-text hover:text-danger-text"
              >
                <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
                Delete task
              </Button>
            )}
          />
        ) : (
          <span />
        )}
        <Button type="submit" pending={pending}>
          {task ? "Save changes" : "Add task"}
        </Button>
      </div>
    </form>
  );
}
