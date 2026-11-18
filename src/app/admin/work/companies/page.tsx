import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanyManager } from "@/components/admin/company-manager";
import { getWork } from "@/lib/queries/work";

export const metadata: Metadata = { title: "Businesses" };

export default async function CompaniesPage() {
  const { tasks, companies, projects, setupNeeded } = await getWork(); // checks membership
  if (setupNeeded) redirect("/admin/work");

  const openCounts: Record<string, number> = {};
  for (const t of tasks) {
    if (t.status === "done") continue;
    for (const key of [t.companyId, t.projectId]) {
      if (key) openCounts[key] = (openCounts[key] ?? 0) + 1;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-5">
      <Link
        href="/admin/work"
        className="-ml-3 inline-flex min-h-11 items-center gap-1 self-start rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
        Work
      </Link>
      <h1 className="text-title">Businesses</h1>
      <p className="-mt-3 text-muted">
        Each company you work on, with its projects. Tasks can sit under a business, a project, or
        neither.
      </p>
      <CompanyManager companies={companies} projects={projects} openCounts={openCounts} />
    </div>
  );
}
