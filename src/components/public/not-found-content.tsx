import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

/** Shared "not found" message. Private and missing pages look identical. */
export function NotFoundContent() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
      <span className="text-caption font-medium tracking-[2px] text-muted uppercase">
        Not found
      </span>
      <h1 className="text-title md:text-title-lg">This page isn&rsquo;t here</h1>
      <p className="max-w-80 text-ink-soft">
        It may have moved, or it was never part of our story.
      </p>
      <Link href="/" className={buttonClasses({ className: "mt-2" })}>
        Back to home
      </Link>
    </section>
  );
}
