import "server-only";
import { requireMember } from "@/lib/auth";
import { documentLinks } from "@/lib/cloudinary";
import type { ApplicationStatus, DocumentKind } from "@/lib/foundation";
import { createClient } from "@/lib/supabase/server";

export type ApplicationSummary = {
  id: string;
  reference: string;
  status: ApplicationStatus;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  level: string;
  classYear: string;
  schoolName: string;
  schoolType: string;
  supportType: string;
  amountRequested: number;
  currency: string;
  createdAt: string;
  documentCount: number;
};

export type ApplicationDocument = {
  id: string;
  kind: DocumentKind;
  format: string;
  bytes: number;
  pages: number | null;
  name: string | null;
  links: { preview: string; open: string; download: string };
};

export type Application = ApplicationSummary & {
  gender: string | null;
  countryOfResidence: string;
  stateRegion: string | null;
  city: string;
  email: string | null;
  phone: string;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  schoolCity: string;
  schoolCountry: string;
  course: string | null;
  recentResults: string;
  achievements: string | null;
  feePeriod: string;
  feeBreakdown: string | null;
  otherSupport: string | null;
  financialSituation: string;
  statement: string;
  heardFrom: string | null;
  consentedAt: string;
  amountApproved: number | null;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  documents: ApplicationDocument[];
};

const SUMMARY_COLUMNS =
  "id, reference, status, full_name, date_of_birth, nationality, level, class_year, school_name, school_type, support_type, amount_requested, currency, created_at, application_documents(count)";

type Row = Record<string, unknown> & { application_documents?: { count: number }[] };

const toSummary = (r: Row): ApplicationSummary => ({
  id: r.id as string,
  reference: r.reference as string,
  status: r.status as ApplicationStatus,
  fullName: r.full_name as string,
  dateOfBirth: r.date_of_birth as string,
  nationality: r.nationality as string,
  level: r.level as string,
  classYear: r.class_year as string,
  schoolName: r.school_name as string,
  schoolType: r.school_type as string,
  supportType: r.support_type as string,
  amountRequested: Number(r.amount_requested),
  currency: r.currency as string,
  createdAt: r.created_at as string,
  documentCount: r.application_documents?.[0]?.count ?? 0,
});

const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

export type ApplicationFilters = { status?: ApplicationStatus; level?: string; q?: string };

/** Applications, newest first, with counts per status for the filter chips. */
export async function listApplications(filters: ApplicationFilters): Promise<{
  applications: ApplicationSummary[];
  counts: Record<string, number>;
  setupNeeded?: boolean;
}> {
  await requireMember();
  const db = await createClient();
  let query = db
    .from("scholarship_applications")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(300);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.level) query = query.eq("level", filters.level);
  if (filters.q) {
    const q = filters.q.replace(/[%,()*\\]/g, " ").trim();
    if (q)
      query = query.or(`full_name.ilike.%${q}%,reference.ilike.%${q}%,school_name.ilike.%${q}%`);
  }
  const [{ data, error }, all] = await Promise.all([
    query,
    db.from("scholarship_applications").select("status"),
  ]);
  if (error) {
    if (missingTable(error.code)) return { applications: [], counts: {}, setupNeeded: true };
    throw new Error(`Couldn't load applications: ${error.message}`);
  }
  const counts: Record<string, number> = {};
  for (const { status } of (all.data ?? []) as { status: string }[])
    counts[status] = (counts[status] ?? 0) + 1;
  return { applications: ((data ?? []) as Row[]).map(toSummary), counts };
}

/** How many applications are waiting for a first look (for the dashboard). */
export async function countNewApplications(): Promise<number> {
  await requireMember();
  const db = await createClient();
  const { count, error } = await db
    .from("scholarship_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  return error ? 0 : (count ?? 0);
}

/** One application with everything in it, and links to its documents. */
export async function getApplication(id: string): Promise<Application | null> {
  await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createClient();
  const { data, error } = await db
    .from("scholarship_applications")
    .select(
      "*, application_documents(id, kind, public_id, format, bytes, pages, original_name, created_at), reviewer:profiles!scholarship_applications_reviewed_by_fkey(display_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (missingTable(error.code)) return null;
    throw new Error(`Couldn't load the application: ${error.message}`);
  }
  if (!data) return null;
  const r = data as Row & Record<string, never>;
  const docs = ((r.application_documents ?? []) as unknown as Record<string, unknown>[]).sort(
    (a, b) => String(a.created_at).localeCompare(String(b.created_at)),
  );
  const reviewer = r.reviewer as unknown as { display_name: string } | null;
  return {
    ...toSummary({ ...r, application_documents: [{ count: docs.length }] }),
    gender: r.gender,
    countryOfResidence: r.country_of_residence,
    stateRegion: r.state_region,
    city: r.city,
    email: r.email,
    phone: r.phone,
    guardianName: r.guardian_name,
    guardianRelationship: r.guardian_relationship,
    guardianPhone: r.guardian_phone,
    guardianEmail: r.guardian_email,
    schoolCity: r.school_city,
    schoolCountry: r.school_country,
    course: r.course,
    recentResults: r.recent_results,
    achievements: r.achievements,
    feePeriod: r.fee_period,
    feeBreakdown: r.fee_breakdown,
    otherSupport: r.other_support,
    financialSituation: r.financial_situation,
    statement: r.statement,
    heardFrom: r.heard_from,
    consentedAt: r.consented_at,
    amountApproved: r.amount_approved === null ? null : Number(r.amount_approved),
    reviewNotes: r.review_notes,
    reviewedBy: reviewer?.display_name ?? null,
    reviewedAt: r.reviewed_at,
    documents: docs.map((d) => ({
      id: d.id as string,
      kind: d.kind as DocumentKind,
      format: d.format as string,
      bytes: d.bytes as number,
      pages: (d.pages as number | null) ?? null,
      name: (d.original_name as string | null) ?? null,
      links: documentLinks(d.public_id as string, d.format as string),
    })),
  };
}
