"use client";

import { CircleAlert, FileText, ImageIcon, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import {
  confirmDocument,
  getDocumentTickets,
  submitApplication,
} from "@/app/(public)/foundation/apply/actions";
import { Button } from "@/components/ui/button";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  AFRICAN_COUNTRIES,
  CURRENCIES,
  DOCUMENT_KINDS,
  FEE_PERIODS,
  LEVELS,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENTS,
  SCHOOL_TYPES,
  SUPPORT_TYPES,
  TERTIARY_LEVELS,
  ageOn,
  type DocumentKind,
  type Level,
} from "@/lib/foundation";
import { postWithProgress, reencode, UploadError } from "@/lib/upload-prep";
import { cn } from "@/lib/utils";
import type { ApplicationInput } from "@/lib/validation";

/** Answers are kept on this device while you fill the form in (not the files). */
const STORAGE_KEY = "dalin-foundation-application";

const EMPTY = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "NG",
  countryOfResidence: "Nigeria",
  stateRegion: "",
  city: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianRelationship: "",
  guardianPhone: "",
  guardianEmail: "",
  level: "",
  classYear: "",
  schoolName: "",
  schoolType: "",
  schoolCity: "",
  schoolCountry: "Nigeria",
  course: "",
  recentResults: "",
  achievements: "",
  supportType: "",
  amountRequested: "",
  currency: "NGN",
  feePeriod: "session",
  feeBreakdown: "",
  otherSupport: "",
  financialSituation: "",
  statement: "",
  heardFrom: "",
};
type Values = typeof EMPTY;
type Key = keyof Values;

type Doc = {
  key: string;
  kind: DocumentKind;
  file: File | null;
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  message?: string;
};

const COUNTRY_NAMES = AFRICAN_COUNTRIES.map((c) => c.name);

export function ApplicationForm() {
  const router = useRouter();
  // Today in Lagos (to tell whether the student is under 18) and when the form
  // was opened (a spam check). Both are read in the browser once it loads.
  const [today, setToday] = useState("");
  const startedAt = useRef(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [website, setWebsite] = useState(""); // spam trap, stays empty
  const [docs, setDocs] = useState<Doc[]>(() => [newDoc("fee_invoice", "first")]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [submitted, setSubmitted] = useState<{ id: string; reference: string; token: string }>();
  const [pending, startTransition] = useTransition();
  const countryList = useId();

  // Bring back answers from an earlier visit on this device.
  useEffect(() => {
    startedAt.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date()));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setValues({ ...EMPTY, ...(JSON.parse(saved) as Partial<Values>) });
    } catch {
      // No storage (private mode): start fresh.
    }
  }, []);

  function set(key: Key, value: string) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (errors[key])
      setErrors((all) => Object.fromEntries(Object.entries(all).filter(([k]) => k !== key)));
  }

  const age =
    today && /^\d{4}-\d{2}-\d{2}$/.test(values.dateOfBirth)
      ? ageOn(values.dateOfBirth, today)
      : null;
  const minor = age !== null && age < 18;
  const tertiary = TERTIARY_LEVELS.includes(values.level as Level);
  const chosenDocs = docs.filter((d) => d.file);

  function submit() {
    setError(undefined);
    setErrors({});
    startTransition(async () => {
      let app = submitted;
      if (!app) {
        const input: ApplicationInput = {
          ...values,
          gender: values.gender as ApplicationInput["gender"],
          nationality: values.nationality as ApplicationInput["nationality"],
          level: values.level as ApplicationInput["level"],
          schoolType: values.schoolType as ApplicationInput["schoolType"],
          supportType: values.supportType as ApplicationInput["supportType"],
          currency: values.currency as ApplicationInput["currency"],
          feePeriod: values.feePeriod as ApplicationInput["feePeriod"],
          amountRequested: values.amountRequested.replace(/[,\s]/g, ""),
          consent: consent as true,
          guardianConsent,
          website,
          startedAt: startedAt.current,
        };
        const res = await submitApplication(input);
        if (!res.application) {
          setError(res.error);
          setErrors(res.fieldErrors ?? {});
          requestAnimationFrame(() =>
            document.querySelector("[aria-invalid=true], [role=alert]")?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            }),
          );
          return;
        }
        app = res.application;
        setSubmitted(app);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      }

      const failed = await uploadDocuments(app);
      if (failed === 0) finish(app.reference);
      else
        setError(
          `${failed} document${failed === 1 ? "" : "s"} didn't upload. Try again, or finish without them.`,
        );
    });
  }

  async function uploadDocuments(app: { id: string; token: string }) {
    const todo = docs.filter((d) => d.file && d.status !== "done");
    if (!todo.length) return 0;
    const prepared: { doc: Doc; file: File; type: "image" | "pdf" }[] = [];
    let failed = 0;
    for (const doc of todo) {
      try {
        const isPdf = doc.file!.type === "application/pdf" || /\.pdf$/i.test(doc.file!.name);
        if (isPdf && doc.file!.size > MAX_DOCUMENT_BYTES)
          throw new UploadError(`${doc.file!.name} is over 10 MB.`);
        const file = isPdf ? doc.file! : await reencode(doc.file!);
        prepared.push({ doc, file, type: isPdf ? "pdf" : "image" });
      } catch (e) {
        failed++;
        update(doc.key, {
          status: "error",
          message: e instanceof UploadError ? e.message : "This file couldn't be read.",
        });
      }
    }
    if (!prepared.length) return failed;

    const { tickets, error: ticketError } = await getDocumentTickets({
      applicationId: app.id,
      token: (app as { token: string }).token,
      types: prepared.map((p) => p.type),
    });
    if (!tickets) {
      for (const p of prepared) update(p.doc.key, { status: "error", message: ticketError });
      return failed + prepared.length;
    }

    for (const [i, p] of prepared.entries()) {
      const ticket = tickets[i];
      if (!ticket) {
        failed++;
        update(p.doc.key, { status: "error", message: "No room for more documents." });
        continue;
      }
      try {
        update(p.doc.key, { status: "uploading", progress: 0, message: undefined });
        const form = new FormData();
        for (const [k, v] of Object.entries(ticket.fields)) form.append(k, v);
        form.append("file", p.file, p.file.name);
        await postWithProgress(ticket.url, form, (f) =>
          update(p.doc.key, { progress: Math.round(f * 95) }),
        );
        const res = await confirmDocument({
          applicationId: app.id,
          token: (app as { token: string }).token,
          publicId: ticket.publicId,
          kind: p.doc.kind,
          name: p.doc.file!.name.slice(0, 200),
        });
        if (res.error) throw new UploadError(res.error);
        update(p.doc.key, { status: "done", progress: 100 });
      } catch (e) {
        failed++;
        update(p.doc.key, {
          status: "error",
          message: e instanceof UploadError ? e.message : "The upload failed.",
        });
      }
    }
    return failed;
  }

  function update(key: string, patch: Partial<Doc>) {
    setDocs((all) => all.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function finish(reference: string) {
    router.push(`/foundation/apply/thanks?ref=${encodeURIComponent(reference)}`);
  }

  const text = (
    key: Key,
    label: ReactNode,
    props: {
      required?: boolean;
      hint?: string;
      type?: string;
      max?: number;
      placeholder?: string;
      autoComplete?: string;
      inputMode?: "numeric" | "tel" | "email" | "decimal";
      list?: string;
    } = {},
  ) => (
    <Field id={key} label={label} required={props.required} hint={props.hint} error={errors[key]}>
      <Input
        id={key}
        name={key}
        type={props.type ?? "text"}
        value={values[key]}
        maxLength={props.max}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        list={props.list}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={describedBy(key, { hint: props.hint, error: errors[key] })}
        disabled={Boolean(submitted)}
      />
    </Field>
  );

  const area = (
    key: Key,
    label: ReactNode,
    props: { required?: boolean; hint?: string; max: number; rows?: number },
  ) => (
    <Field id={key} label={label} required={props.required} hint={props.hint} error={errors[key]}>
      <Textarea
        id={key}
        name={key}
        rows={props.rows ?? 4}
        value={values[key]}
        maxLength={props.max}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={describedBy(key, { hint: props.hint, error: errors[key] })}
        disabled={Boolean(submitted)}
      />
    </Field>
  );

  const select = (
    key: Key,
    label: ReactNode,
    options: readonly { value: string; label: string }[],
    props: { required?: boolean; hint?: string; placeholder?: string } = {},
  ) => (
    <Field id={key} label={label} required={props.required} hint={props.hint} error={errors[key]}>
      <Select
        id={key}
        name={key}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={describedBy(key, { hint: props.hint, error: errors[key] })}
        disabled={Boolean(submitted)}
      >
        {props.placeholder !== undefined && <option value="">{props.placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-10"
    >
      <datalist id={countryList}>
        {COUNTRY_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {/* Spam trap: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <Section n={1} title="About the student">
        {text("fullName", "Student's full name", {
          required: true,
          max: 120,
          autoComplete: "name",
        })}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("dateOfBirth", "Date of birth", { required: true, type: "date" })}
          {select(
            "gender",
            "Gender",
            [
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
            ],
            { placeholder: "Prefer not to say" },
          )}
        </div>
        {select(
          "nationality",
          "Nationality",
          AFRICAN_COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
          { required: true, hint: "The foundation supports Nigerians and other Africans." },
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("countryOfResidence", "Country you live in", {
            required: true,
            max: 80,
            list: countryList,
          })}
          {text("stateRegion", "State or region", { max: 80, placeholder: "e.g. Lagos" })}
        </div>
        {text("city", "City or town", { required: true, max: 80 })}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("phone", "Phone (WhatsApp if possible)", {
            required: true,
            type: "tel",
            inputMode: "tel",
            max: 25,
            placeholder: "+234 …",
            autoComplete: "tel",
          })}
          {text("email", "Email", {
            type: "email",
            inputMode: "email",
            max: 200,
            autoComplete: "email",
          })}
        </div>
      </Section>

      <Section
        n={2}
        title="Parent or guardian"
        intro={
          minor
            ? "The student is under 18, so a parent or guardian must fill in this form and agree to it."
            : "Required if the student is under 18. Optional otherwise."
        }
        highlight={minor}
      >
        {text("guardianName", "Parent or guardian's full name", { required: minor, max: 120 })}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("guardianRelationship", "Relationship to the student", {
            required: minor,
            max: 60,
            placeholder: "e.g. Mother, Uncle",
          })}
          {text("guardianPhone", "Their phone", {
            required: minor,
            type: "tel",
            inputMode: "tel",
            max: 25,
          })}
        </div>
        {text("guardianEmail", "Their email", { type: "email", inputMode: "email", max: 200 })}
      </Section>

      <Section n={3} title="School">
        {select("level", "Level of study", LEVELS, { required: true, placeholder: "Choose…" })}
        {text("classYear", "Class or year", {
          required: true,
          max: 60,
          placeholder: "e.g. Primary 4, JSS 2, SS 3, 200 level, Year 1",
        })}
        {tertiary &&
          text("course", "Course or programme", {
            required: true,
            max: 160,
            placeholder: "e.g. BSc Computer Science",
          })}
        {text("schoolName", "School, college or university", { required: true, max: 160 })}
        {select("schoolType", "Type of school", SCHOOL_TYPES, {
          required: true,
          placeholder: "Choose…",
        })}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("schoolCity", "School's city or town", { required: true, max: 80 })}
          {text("schoolCountry", "School's country", {
            required: true,
            max: 80,
            list: countryList,
          })}
        </div>
        {area("recentResults", "Most recent results", {
          required: true,
          max: 2000,
          hint: "e.g. last term's position and average, WAEC/NECO grades, CGPA.",
        })}
        {area("achievements", "Awards or achievements", { max: 2000, rows: 3 })}
      </Section>

      <Section n={4} title="Support needed">
        {select("supportType", "What are you applying for?", SUPPORT_TYPES, {
          required: true,
          placeholder: "Choose…",
        })}
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          {select(
            "currency",
            "Currency",
            CURRENCIES.map((c) => ({ value: c, label: c })),
            { required: true },
          )}
          {text("amountRequested", "Amount needed", {
            required: true,
            inputMode: "decimal",
            max: 18,
            placeholder: "e.g. 150000",
          })}
        </div>
        {select("feePeriod", "The amount covers", FEE_PERIODS, { required: true })}
        {area("feeBreakdown", "Breakdown of fees", {
          max: 2000,
          rows: 3,
          hint: "e.g. tuition, books, uniform, exam fees, hostel.",
        })}
        {area("otherSupport", "Other help you already receive", { max: 1000, rows: 2 })}
        {area("financialSituation", "The family's financial situation", {
          required: true,
          max: 3000,
          hint: "Who pays the fees today, and why support is needed now.",
        })}
        {area("statement", "Personal statement", {
          required: true,
          max: 5000,
          rows: 6,
          hint: "In the student's own words (or the parent's): goals, why this education matters. At least 50 characters.",
        })}
        {text("heardFrom", "How did you hear about us?", { max: 200 })}
      </Section>

      <Section
        n={5}
        title="Documents"
        intro={`PDFs or photos, up to ${MAX_DOCUMENTS} files of 10 MB each. A school fees invoice and the latest results help us most. Photos are cleaned of location data before upload.`}
      >
        <ul className="flex flex-col gap-3">
          {docs.map((d) => (
            <li key={d.key} className="flex flex-col gap-2 rounded-xl bg-linen p-3">
              <div className="flex items-center gap-2">
                <Select
                  aria-label="Type of document"
                  value={d.kind}
                  onChange={(e) => update(d.key, { kind: e.target.value as DocumentKind })}
                  disabled={d.status === "done" || d.status === "uploading"}
                  className="bg-ivory"
                >
                  {DOCUMENT_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </Select>
                {d.status !== "done" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove this document"
                    onClick={() => setDocs((all) => all.filter((x) => x.key !== d.key))}
                    disabled={d.status === "uploading"}
                  >
                    <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
                  </Button>
                )}
              </div>
              {d.file ? (
                <p className="flex items-center gap-2 text-label break-all">
                  {/pdf/i.test(d.file.type) ? (
                    <FileText
                      aria-hidden
                      className="size-4.5 shrink-0 text-accent"
                      strokeWidth={1.8}
                    />
                  ) : (
                    <ImageIcon
                      aria-hidden
                      className="size-4.5 shrink-0 text-accent"
                      strokeWidth={1.8}
                    />
                  )}
                  {d.file.name}
                  <span className="shrink-0 text-caption text-muted">
                    {(d.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </p>
              ) : (
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  aria-label="Choose a file"
                  onChange={(e) =>
                    update(d.key, { file: e.target.files?.[0] ?? null, status: "idle" })
                  }
                  className="text-label file:mr-3 file:h-11 file:rounded-xl file:border-0 file:bg-accent-dark file:px-4 file:font-semibold file:text-white"
                />
              )}
              {d.status === "uploading" && (
                <div className="h-1.5 overflow-hidden rounded-full bg-sand" aria-hidden>
                  <div
                    className="h-full bg-accent-dark transition-all"
                    style={{ width: `${d.progress}%` }}
                  />
                </div>
              )}
              {d.status === "done" && <p className="text-caption text-muted">Uploaded.</p>}
              {d.status === "error" && <p className="text-caption text-danger-text">{d.message}</p>}
            </li>
          ))}
        </ul>
        {docs.length < MAX_DOCUMENTS && (
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setDocs((all) => [...all, newDoc(nextKind(all))])}
          >
            <Plus aria-hidden className="size-4.5" strokeWidth={2} />
            Add a document
          </Button>
        )}
      </Section>

      <Section n={6} title="Declaration">
        <Check
          id="consent"
          checked={consent}
          onChange={setConsent}
          error={errors.consent}
          disabled={Boolean(submitted)}
        >
          I confirm the information in this application is true. I agree that the foundation may
          keep and use it, and contact me or the student&rsquo;s school, to assess this application.
        </Check>
        {minor && (
          <Check
            id="guardianConsent"
            checked={guardianConsent}
            onChange={setGuardianConsent}
            error={errors.guardianConsent}
            disabled={Boolean(submitted)}
          >
            I am the student&rsquo;s parent or guardian and I agree to this application on their
            behalf.
          </Check>
        )}
      </Section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-rose-tint px-4 py-3 text-label text-danger-text"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4.5 shrink-0" strokeWidth={1.8} />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" fullWidth pending={pending}>
          {submitted
            ? "Try the documents again"
            : chosenDocs.length
              ? `Send application and ${chosenDocs.length} document${chosenDocs.length === 1 ? "" : "s"}`
              : "Send application"}
        </Button>
        {submitted && !pending && (
          <Button variant="ghost" fullWidth onClick={() => finish(submitted.reference)}>
            Finish without the remaining documents
          </Button>
        )}
        {!submitted && (
          <p className="text-center text-caption text-muted">
            Your answers are kept on this device until you send them.
          </p>
        )}
      </div>
    </form>
  );
}

function newDoc(kind: DocumentKind, key: string = crypto.randomUUID()): Doc {
  return { key, kind, file: null, status: "idle", progress: 0 };
}

/** Suggest the next kind of document not yet added. */
function nextKind(docs: Doc[]): DocumentKind {
  const order: DocumentKind[] = [
    "fee_invoice",
    "results",
    "admission_letter",
    "id_document",
    "other",
  ];
  return order.find((k) => !docs.some((d) => d.kind === k)) ?? "other";
}

function Section({
  n,
  title,
  intro,
  highlight,
  children,
}: {
  n: number;
  title: string;
  intro?: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 flex items-baseline gap-2 font-serif text-section">
        <span className="font-sans text-label font-semibold text-accent-dark">{n}.</span>
        {title}
      </legend>
      {intro && (
        <p
          className={cn(
            "-mt-2 text-label",
            highlight ? "rounded-xl bg-rose-tint px-4 py-3 text-danger-text" : "text-muted",
          )}
        >
          {intro}
        </p>
      )}
      {children}
    </fieldset>
  );
}

function Check({
  id,
  checked,
  onChange,
  error,
  disabled,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-accent-dark"
        />
        <span className="text-label">{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
