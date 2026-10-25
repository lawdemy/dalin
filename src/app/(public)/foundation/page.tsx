import { BookOpenCheck, GraduationCap, HandCoins, School, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/public/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { DOCUMENT_KINDS, FOUNDATION_NAME, LEVELS } from "@/lib/foundation";
import { shareMetadata } from "@/lib/metadata";

const description =
  "Scholarships and school fees support for Nigerian and African students, from primary school to PhD.";

export const metadata: Metadata = {
  title: "Foundation",
  description,
  ...shareMetadata({ title: FOUNDATION_NAME, description }),
};

const STEPS = [
  {
    title: "Apply online",
    body: "Fill in the form and add a fees invoice and recent results. It takes about 15 minutes.",
  },
  {
    title: "We review",
    body: "We read every application. We may call you or the school to confirm details.",
  },
  {
    title: "We decide",
    body: "If we can help, we tell you how much and for which term or session.",
  },
  {
    title: "We pay the school",
    body: "Support is paid straight to the school or institution, never in cash.",
  },
];

export default function FoundationPage() {
  return (
    <div className="mx-auto flex w-full max-w-200 flex-col gap-14 px-5 pb-16 md:px-6 md:pb-24">
      <header className="flex flex-col items-center gap-3 pt-10 text-center md:pt-12">
        <Eyebrow>{FOUNDATION_NAME}</Eyebrow>
        <h1 className="text-title md:text-title-lg">
          Helping children and young people stay in school
        </h1>
        <p className="max-w-140 text-lead text-ink-soft">
          We give academic scholarships and help with school fees to Nigerian and African students,
          at public and private schools, from primary school all the way to a PhD.
        </p>
        <Link href="/foundation/apply" className={buttonClasses({ size: "lg", className: "mt-3" })}>
          Apply for support
        </Link>
      </header>

      <section aria-labelledby="who" className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl bg-linen p-5 md:p-6">
          <GraduationCap aria-hidden className="size-7 text-accent" strokeWidth={1.5} />
          <h2 id="who" className="text-section">
            Who can apply
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-ink-soft">
            <li>Nigerians and nationals of other African countries.</li>
            <li>Students at public (government) or private schools.</li>
            <li>For under-18s, a parent or guardian applies.</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-linen p-5 md:p-6">
          <School aria-hidden className="size-7 text-accent" strokeWidth={1.5} />
          <h2 className="text-section">Levels we support</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-ink-soft">
            {LEVELS.map((l) => (
              <li key={l.value}>{l.label}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-linen p-5 md:p-6">
          <BookOpenCheck aria-hidden className="size-7 text-accent" strokeWidth={1.5} />
          <h2 className="text-section">Academic scholarships</h2>
          <p className="text-ink-soft">
            For students with strong results who need help to keep going.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-linen p-5 md:p-6">
          <HandCoins aria-hidden className="size-7 text-accent" strokeWidth={1.5} />
          <h2 className="text-section">School fees support</h2>
          <p className="text-ink-soft">
            For families who can&rsquo;t meet this term&rsquo;s or this session&rsquo;s fees.
          </p>
        </div>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-5">
        <h2 id="how" className="text-section md:text-section-lg">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-tint font-semibold text-danger-text">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-card-sm font-semibold">{s.title}</h3>
                <p className="text-ink-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="need" className="flex flex-col gap-3">
        <h2 id="need" className="text-section md:text-section-lg">
          What you&rsquo;ll need
        </h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-ink-soft">
          {DOCUMENT_KINDS.filter((k) => k.value !== "other").map((k) => (
            <li key={k.value}>{k.label} (PDF or a clear photo)</li>
          ))}
          <li>The school&rsquo;s name and location, and the amount of fees needed.</li>
        </ul>
        <p className="text-muted">
          We can&rsquo;t help everyone who applies, and applying doesn&rsquo;t guarantee support.
          Applying is free: we never ask for money.
        </p>
      </section>

      <section
        aria-labelledby="privacy"
        className="flex gap-4 rounded-xl border border-sand p-5 md:p-6"
      >
        <ShieldCheck aria-hidden className="size-7 shrink-0 text-accent" strokeWidth={1.5} />
        <div className="flex flex-col gap-1">
          <h2 id="privacy" className="font-serif text-card font-semibold">
            Your information is private
          </h2>
          <p className="text-ink-soft">
            Only the two of us who run the foundation can see applications and documents. We use
            them only to assess the application, keep them securely, and delete them when asked.
            Photos of documents are cleaned of location data before they leave your phone.
          </p>
        </div>
      </section>

      <div className="flex justify-center">
        <Link href="/foundation/apply" className={buttonClasses({ size: "lg" })}>
          Start an application
        </Link>
      </div>
    </div>
  );
}
