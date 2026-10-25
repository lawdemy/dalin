import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationForm } from "@/components/public/application-form";
import { Eyebrow } from "@/components/public/section-heading";
import { FOUNDATION_NAME } from "@/lib/foundation";

export const metadata: Metadata = {
  title: "Apply · Foundation",
  description: `Apply to the ${FOUNDATION_NAME} for a scholarship or school fees support.`,
};

export default function ApplyPage() {
  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-8 px-5 pb-16 md:px-6 md:pb-24">
      <header className="flex flex-col gap-2 pt-10 md:pt-12">
        <Eyebrow>{FOUNDATION_NAME}</Eyebrow>
        <h1 className="text-title">Apply for support</h1>
        <p className="text-ink-soft">
          For Nigerian and African students, primary school to PhD. Fields marked{" "}
          <span className="text-accent-dark">*</span> are required. See{" "}
          <Link href="/foundation">who can apply and how it works</Link>.
        </p>
      </header>
      <ApplicationForm />
    </div>
  );
}
