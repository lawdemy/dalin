"use client";

import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteCompany,
  deleteProject,
  saveCompany,
  saveProject,
  setCompanyArchived,
  setProjectArchived,
  type WorkResult,
} from "@/app/admin/work/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { COMPANY_COLORS } from "@/lib/constants";
import type { WorkCompany, WorkProject } from "@/lib/queries/work";
import { cn } from "@/lib/utils";

type CompanyManagerProps = {
  companies: WorkCompany[];
  projects: WorkProject[];
  /** Open tasks per business and per project id. */
  openCounts: Record<string, number>;
};

export function CompanyManager({ companies, projects, openCounts }: CompanyManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(companies.length % COMPANY_COLORS.length);
  const [showArchived, setShowArchived] = useState(false);

  /** Runs an action, shows its error, and reloads the lists. Resolves true on success. */
  function run(action: () => Promise<WorkResult>) {
    setError(undefined);
    return new Promise<boolean>((resolve) =>
      startTransition(async () => {
        const res = await action();
        if (res.error) setError(res.error);
        router.refresh();
        resolve(!res.error);
      }),
    );
  }

  const active = companies.filter((c) => !c.archived);
  const archived = companies.filter((c) => c.archived);

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          if (await run(() => saveCompany({ name: newName, color: newColor }))) {
            setNewName("");
            setNewColor((newColor + 1) % COMPANY_COLORS.length);
          }
        }}
        className="flex flex-col gap-3 rounded-xl bg-linen p-4"
      >
        <label htmlFor="new-company" className="text-label font-medium">
          Add a business
        </label>
        <div className="flex gap-2">
          <Input
            id="new-company"
            value={newName}
            maxLength={80}
            placeholder="Business name"
            onChange={(e) => setNewName(e.target.value)}
            className="bg-ivory"
          />
          <Button type="submit" pending={pending} aria-label="Add business" className="w-12 px-0">
            {!pending && <Plus aria-hidden className="size-5" strokeWidth={2} />}
          </Button>
        </div>
        <ColorPicker value={newColor} onChange={setNewColor} />
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-danger-text">
          {error}
        </p>
      )}

      {active.length === 0 && (
        <p className="text-muted">No businesses yet. Add each company you work on above.</p>
      )}

      {active.map((c) => (
        <CompanyCard
          key={c.id}
          company={c}
          projects={projects.filter((p) => p.companyId === c.id)}
          openCounts={openCounts}
          run={run}
        />
      ))}

      {archived.length > 0 && (
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setShowArchived(!showArchived)}
            aria-expanded={showArchived}
          >
            {showArchived ? "Hide" : "Show"} archived businesses ({archived.length})
          </Button>
          {showArchived &&
            archived.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                projects={projects.filter((p) => p.companyId === c.id)}
                openCounts={openCounts}
                run={run}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-1">
      {COMPANY_COLORS.map((color, i) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`Colour ${i + 1}`}
          onClick={() => onChange(i)}
          className="flex size-11 items-center justify-center"
        >
          <span
            className={cn(
              "size-7 rounded-full",
              color,
              value === i && "ring-2 ring-ink ring-offset-2 ring-offset-linen",
            )}
          />
        </button>
      ))}
    </div>
  );
}

type CompanyCardProps = {
  company: WorkCompany;
  projects: WorkProject[];
  openCounts: Record<string, number>;
  run: (action: () => Promise<WorkResult>) => Promise<boolean>;
};

function CompanyCard({ company, projects, openCounts, run }: CompanyCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(company.name);
  const [color, setColor] = useState(company.color);
  const [newProject, setNewProject] = useState("");
  const open = openCounts[company.id] ?? 0;

  return (
    <section
      aria-label={company.name}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-sand p-4",
        company.archived && "opacity-75",
      )}
    >
      {editing ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => saveCompany({ id: company.id, name, color }))) setEditing(false);
          }}
          className="flex flex-col gap-3"
        >
          <Input
            aria-label="Business name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(company.name);
                setColor(company.color);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn("size-4 shrink-0 rounded-full", COMPANY_COLORS[company.color])}
          />
          <h2 className="min-w-0 flex-1 font-serif text-card-sm font-semibold wrap-break-word">
            {company.name}
            {company.archived && (
              <span className="font-sans text-caption text-muted"> · archived</span>
            )}
          </h2>
          <span className="text-caption text-muted">{open} open</span>
        </div>
      )}

      {!editing && (
        <div className="-mx-2 flex flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden className="size-4" strokeWidth={1.8} />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => run(() => setCompanyArchived(company.id, !company.archived))}
          >
            {company.archived ? (
              <ArchiveRestore aria-hidden className="size-4" strokeWidth={1.8} />
            ) : (
              <Archive aria-hidden className="size-4" strokeWidth={1.8} />
            )}
            {company.archived ? "Restore" : "Archive"}
          </Button>
          <ConfirmDialog
            title={`Delete ${company.name}?`}
            description={
              <>
                Its projects are deleted too. Its tasks stay, without a business. Archiving keeps
                everything and just hides it from the lists.
              </>
            }
            onConfirm={async () => {
              await run(() => deleteCompany(company.id));
            }}
            trigger={(openDialog) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={openDialog}
                className="text-danger-text hover:text-danger-text"
              >
                <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
                Delete
              </Button>
            )}
          />
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-divider pt-3">
        <span className="text-label font-medium">Projects</span>
        {projects.length === 0 && <p className="text-caption text-muted">No projects yet.</p>}
        <ul className="flex flex-col divide-y divide-divider">
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} open={openCounts[p.id] ?? 0} run={run} />
          ))}
        </ul>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newProject.trim()) return;
            if (await run(() => saveProject({ companyId: company.id, name: newProject })))
              setNewProject("");
          }}
          className="mt-1 flex gap-2"
        >
          <Input
            aria-label={`New project for ${company.name}`}
            placeholder="Add a project"
            value={newProject}
            maxLength={80}
            onChange={(e) => setNewProject(e.target.value)}
          />
          <Button type="submit" variant="secondary" aria-label="Add project" className="w-12 px-0">
            <Plus aria-hidden className="size-5" strokeWidth={2} />
          </Button>
        </form>
      </div>
    </section>
  );
}

type ProjectRowProps = {
  project: WorkProject;
  open: number;
  run: (action: () => Promise<WorkResult>) => Promise<boolean>;
};

function ProjectRow({ project, open, run }: ProjectRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);

  if (editing) {
    return (
      <li className="py-2">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await run(() => saveProject({ id: project.id, companyId: project.companyId, name }))
            )
              setEditing(false);
          }}
          className="flex flex-wrap gap-2"
        >
          <Input
            aria-label="Project name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 basis-48"
          />
          <Button type="submit" size="sm">
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setName(project.name);
            }}
          >
            Cancel
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1">
      <span className={cn("min-w-0 flex-1 py-2 wrap-break-word", project.archived && "text-muted")}>
        {project.name}
        <span className="text-caption text-muted">
          {" "}
          · {project.archived ? "archived" : `${open} open`}
        </span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Rename ${project.name}`}
        onClick={() => setEditing(true)}
      >
        <Pencil aria-hidden className="size-4" strokeWidth={1.8} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={project.archived ? `Restore ${project.name}` : `Archive ${project.name}`}
        onClick={() => run(() => setProjectArchived(project.id, !project.archived))}
      >
        {project.archived ? (
          <ArchiveRestore aria-hidden className="size-4" strokeWidth={1.8} />
        ) : (
          <Archive aria-hidden className="size-4" strokeWidth={1.8} />
        )}
      </Button>
      <ConfirmDialog
        title={`Delete ${project.name}?`}
        description={<>Its tasks stay, under the business without a project.</>}
        onConfirm={async () => {
          await run(() => deleteProject(project.id));
        }}
        trigger={(openDialog) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${project.name}`}
            onClick={openDialog}
            className="text-danger-text hover:text-danger-text"
          >
            <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
          </Button>
        )}
      />
    </li>
  );
}
