import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <section className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-section-lg">Entry not found</h1>
      <p className="max-w-80 text-ink-soft">It may have been deleted, or the link is wrong.</p>
      <Link href="/admin" className={buttonClasses({ className: "mt-2" })}>
        Back to the diary
      </Link>
    </section>
  );
}
