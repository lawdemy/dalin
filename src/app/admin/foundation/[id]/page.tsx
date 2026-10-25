import { ArrowLeft, Download, ExternalLink, FileText, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ApplicationReview, StatusBadge } from "@/components/admin/application-review";
import { TIME_ZONE } from "@/lib/constants";
import {
  DOCUMENT_KINDS,
  FEE_PERIODS,
  LEVELS,
  SCHOOL_TYPES,
  SUPPORT_TYPES,
  ageOn,
  countryName,
  labelOf,
} from "@/lib/foundation";
import { todayInDiary } from "@/lib/format";
import { getApplication } from "@/lib/queries/foundation";

export const metadata: Metadata = { title: "Application" };

const stamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const birth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function ApplicationPage({ params }: PageProps<"/admin/foundation/[id]">) {
  const { id } = await params;
  const a = await getApplication(id); // checks membership
  if (!a) notFound();
  const age = ageOn(a.dateOfBirth, todayInDiary());
  const money = (n: number) =>
    `${a.currency} ${n.toLocaleString("en", { maximumFractionDigits: 2 })}`;

  return (
    <article className="mx-auto flex w-full max-w-180 flex-col gap-8">
      <Link
        href="/admin/foundation"
        className="-ml-3 inline-flex min-h-11 items-center gap-1 self-start rounded-xl px-3 text-[0.9375rem] font-medium no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
        Applications
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={a.status} />
          <span className="text-caption text-muted">
            {a.reference} · received {stamp.format(new Date(a.createdAt))}
          </span>
        </div>
        <h1 className="text-title">{a.fullName}</h1>
        <p className="text-ink-soft">
          {labelOf(SUPPORT_TYPES, a.supportType).split(" (")[0]} · {money(a.amountRequested)}{" "}
          {labelOf(FEE_PERIODS, a.feePeriod).toLowerCase()}
        </p>
        <div className="flex flex-wrap gap-x-5">
          <a
            href={`tel:${a.phone.replace(/[^+0-9]/g, "")}`}
            className="inline-flex min-h-11 items-center gap-1.5 font-medium"
          >
            <Phone aria-hidden className="size-4" strokeWidth={1.8} />
            {a.phone}
          </a>
          {a.email && (
            <a
              href={`mailto:${a.email}`}
              className="inline-flex min-h-11 items-center gap-1.5 font-medium break-all"
            >
              <Mail aria-hidden className="size-4" strokeWidth={1.8} />
              {a.email}
            </a>
          )}
        </div>
      </header>

      <ApplicationReview
        id={a.id}
        name={a.fullName}
        status={a.status}
        amountApproved={a.amountApproved}
        reviewNotes={a.reviewNotes}
        currency={a.currency}
        documentCount={a.documents.length}
      />
      {a.reviewedBy && a.reviewedAt && (
        <p className="-mt-6 text-caption text-muted">
          Last reviewed by {a.reviewedBy}, {stamp.format(new Date(a.reviewedAt))}.
        </p>
      )}

      <Section title="Student">
        <Row label="Date of birth">
          {birth.format(new Date(`${a.dateOfBirth}T00:00:00Z`))} (age {age})
        </Row>
        <Row label="Gender">
          {a.gender ? a.gender[0].toUpperCase() + a.gender.slice(1) : "Not given"}
        </Row>
        <Row label="Nationality">{countryName(a.nationality)}</Row>
        <Row label="Lives in">
          {[a.city, a.stateRegion, a.countryOfResidence].filter(Boolean).join(", ")}
        </Row>
      </Section>

      {(a.guardianName || age < 18) && (
        <Section title="Parent or guardian">
          <Row label="Name">{a.guardianName ?? "Not given"}</Row>
          <Row label="Relationship">{a.guardianRelationship ?? "Not given"}</Row>
          <Row label="Phone">
            {a.guardianPhone ? (
              <a href={`tel:${a.guardianPhone.replace(/[^+0-9]/g, "")}`}>{a.guardianPhone}</a>
            ) : (
              "Not given"
            )}
          </Row>
          {a.guardianEmail && (
            <Row label="Email">
              <a href={`mailto:${a.guardianEmail}`} className="break-all">
                {a.guardianEmail}
              </a>
            </Row>
          )}
        </Section>
      )}

      <Section title="School">
        <Row label="Level">{labelOf(LEVELS, a.level)}</Row>
        <Row label="Class or year">{a.classYear}</Row>
        {a.course && <Row label="Course">{a.course}</Row>}
        <Row label="School">
          {a.schoolName} · {labelOf(SCHOOL_TYPES, a.schoolType)}
        </Row>
        <Row label="Location">
          {a.schoolCity}, {a.schoolCountry}
        </Row>
        <Row label="Recent results" block>
          {a.recentResults}
        </Row>
        {a.achievements && (
          <Row label="Achievements" block>
            {a.achievements}
          </Row>
        )}
      </Section>

      <Section title="Need">
        <Row label="Applying for">{labelOf(SUPPORT_TYPES, a.supportType)}</Row>
        <Row label="Amount">
          {money(a.amountRequested)} ({labelOf(FEE_PERIODS, a.feePeriod).toLowerCase()})
        </Row>
        {a.feeBreakdown && (
          <Row label="Breakdown" block>
            {a.feeBreakdown}
          </Row>
        )}
        {a.otherSupport && (
          <Row label="Other support" block>
            {a.otherSupport}
          </Row>
        )}
        <Row label="Financial situation" block>
          {a.financialSituation}
        </Row>
        <Row label="Personal statement" block>
          {a.statement}
        </Row>
        {a.heardFrom && <Row label="Heard about us">{a.heardFrom}</Row>}
      </Section>

      <Section title={`Documents (${a.documents.length})`} plain>
        {a.documents.length === 0 ? (
          <p className="text-muted">No documents were uploaded.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {a.documents.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 rounded-xl border border-sand p-3">
                <a href={d.links.open} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed Cloudinary URL */}
                  <img
                    src={d.links.preview}
                    alt={`Preview of ${labelOf(DOCUMENT_KINDS, d.kind)}`}
                    loading="lazy"
                    className="h-44 w-full rounded-lg bg-linen object-contain"
                  />
                </a>
                <p className="flex items-start gap-1.5 text-label font-medium">
                  <FileText
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-accent"
                    strokeWidth={1.8}
                  />
                  {labelOf(DOCUMENT_KINDS, d.kind)}
                </p>
                <p className="text-caption break-all text-muted">
                  {d.name ?? "File"} · {d.format.toUpperCase()}
                  {d.pages && d.pages > 1 ? ` · ${d.pages} pages` : ""} ·{" "}
                  {(d.bytes / 1024 / 1024).toFixed(1)} MB
                </p>
                <div className="flex gap-4">
                  <a
                    href={d.links.open}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium"
                  >
                    <ExternalLink aria-hidden className="size-4" strokeWidth={1.8} />
                    Open
                  </a>
                  <a
                    href={d.links.download}
                    className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium"
                  >
                    <Download aria-hidden className="size-4" strokeWidth={1.8} />
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-caption text-muted">
        Declaration accepted {stamp.format(new Date(a.consentedAt))}
        {age < 18 ? ", including the parent or guardian's consent." : "."}
      </p>
    </article>
  );
}

function Section({
  title,
  plain,
  children,
}: {
  title: string;
  /** Not a list of label/value rows. */
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-sand pt-6">
      <h2 className="text-section">{title}</h2>
      {plain ? children : <dl className="flex flex-col gap-3">{children}</dl>}
    </section>
  );
}

function Row({ label, block, children }: { label: string; block?: boolean; children: ReactNode }) {
  return (
    <div className={block ? "flex flex-col gap-1" : "grid gap-1 sm:grid-cols-[11rem_1fr]"}>
      <dt className="text-caption font-medium text-muted">{label}</dt>
      <dd className={block ? "break-words whitespace-pre-line" : "break-words"}>{children}</dd>
    </div>
  );
}
