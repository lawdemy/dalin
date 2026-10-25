import { FileText, GraduationCap, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/application-review";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TIME_ZONE } from "@/lib/constants";
import {
  APPLICATION_STATUSES,
  LEVELS,
  SUPPORT_TYPES,
  countryName,
  labelOf,
  type ApplicationStatus,
} from "@/lib/foundation";
import { listApplications } from "@/lib/queries/foundation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Foundation" };

const shortDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function FoundationAdminPage({
  searchParams,
}: PageProps<"/admin/foundation">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const status = APPLICATION_STATUSES.some((s) => s.value === one(sp.status))
    ? (one(sp.status) as ApplicationStatus)
    : undefined;
  const level = LEVELS.some((l) => l.value === one(sp.level)) ? one(sp.level) : undefined;
  const q = one(sp.q)?.slice(0, 80);

  const { applications, counts, setupNeeded } = await listApplications({ status, level, q }); // checks membership
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const href = (next: { status?: string; level?: string; q?: string }) => {
    const p = new URLSearchParams();
    const merged = { status, level, q, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/foundation?${s}` : "/admin/foundation";
  };

  return (
    <div className="mx-auto flex w-full max-w-200 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-title">Foundation</h1>
        <p className="text-muted">
          Scholarship and school fees applications from the{" "}
          <Link href="/foundation">public foundation page</Link>. Only the two of you can see them.
        </p>
      </div>

      {setupNeeded ? (
        <p className="rounded-xl bg-linen px-4 py-3 text-ink-soft">
          Applications switch on once migration 0012 has been run in Supabase.
        </p>
      ) : (
        <>
          <nav
            aria-label="Filter by status"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            <FilterChip href={href({ status: "" })} active={!status}>
              All ({total})
            </FilterChip>
            {APPLICATION_STATUSES.map((s) => (
              <FilterChip
                key={s.value}
                href={href({ status: s.value })}
                active={status === s.value}
              >
                {s.label} ({counts[s.value] ?? 0})
              </FilterChip>
            ))}
          </nav>

          <form action="/admin/foundation" className="flex flex-col gap-2 sm:flex-row">
            {status && <input type="hidden" name="status" value={status} />}
            <div className="relative flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted"
                strokeWidth={1.8}
              />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search name, reference or school"
                aria-label="Search applications"
                className="pl-10"
              />
            </div>
            <select
              name="level"
              defaultValue={level ?? ""}
              aria-label="Level of study"
              className="h-12 rounded-xl border border-line bg-linen px-3 text-body"
            >
              <option value="">All levels</option>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label.split(" (")[0]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-12 rounded-xl bg-accent-dark px-5 font-semibold text-white hover:bg-accent-deep"
            >
              Search
            </button>
          </form>

          {applications.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={total ? "No applications match" : "No applications yet"}
              description={
                total
                  ? "Try another filter or search."
                  : "When someone applies on the public foundation page, it appears here and you both get a notification."
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-divider border-y border-divider">
              {applications.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/foundation/${a.id}`}
                    className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-3 text-ink no-underline hover:bg-linen hover:text-ink"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={cn("font-semibold", a.status === "new" && "text-accent-dark")}
                        >
                          {a.fullName}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <span className="text-label text-ink-soft">
                        {labelOf(LEVELS, a.level).split(" (")[0]} · {a.classYear} · {a.schoolName} (
                        {a.schoolType})
                      </span>
                      <span className="text-caption text-muted">
                        {labelOf(SUPPORT_TYPES, a.supportType).split(" (")[0]} · {a.currency}{" "}
                        {a.amountRequested.toLocaleString("en")} · {countryName(a.nationality)} ·{" "}
                        {shortDate.format(new Date(a.createdAt))} · {a.reference}
                      </span>
                    </div>
                    {a.documentCount > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-caption text-muted">
                        <FileText aria-hidden className="size-3.5" strokeWidth={1.8} />
                        {a.documentCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-full border px-3.5 text-label font-medium no-underline",
        active
          ? "border-ink bg-ink text-ivory hover:text-ivory"
          : "border-line text-ink hover:bg-linen hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
