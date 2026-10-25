import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Application received · Foundation" };

export default function ThanksPage({ searchParams }: PageProps<"/foundation/apply/thanks">) {
  return (
    <div className="mx-auto flex w-full max-w-140 flex-col items-center gap-4 px-5 py-16 text-center md:px-6">
      <CircleCheck aria-hidden className="size-12 text-accent" strokeWidth={1.4} />
      <h1 className="text-title">Application received</h1>
      <Suspense fallback={null}>
        <Reference searchParams={searchParams} />
      </Suspense>
      <p className="text-ink-soft">
        Thank you. We read every application and will contact you by phone or email if we can help
        or need more information. This can take a few weeks.
      </p>
      <p className="text-muted">Applying is free. We will never ask you to pay anything.</p>
      <Link
        href="/foundation"
        className={buttonClasses({ variant: "secondary", className: "mt-2" })}
      >
        Back to the foundation
      </Link>
    </div>
  );
}

async function Reference({
  searchParams,
}: {
  searchParams: PageProps<"/foundation/apply/thanks">["searchParams"];
}) {
  const ref = (await searchParams).ref;
  const value = typeof ref === "string" && /^DLF-\d{2}-[0-9A-F]{6}$/.test(ref) ? ref : null;
  if (!value) return null;
  return (
    <p className="rounded-xl bg-linen px-5 py-3">
      Your reference: <strong className="font-semibold tracking-wide">{value}</strong>
      <br />
      <span className="text-caption text-muted">Keep it in case you need to contact us.</span>
    </p>
  );
}
