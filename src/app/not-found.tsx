import type { Metadata } from "next";
import { NotFoundContent } from "@/components/public/not-found-content";

export const metadata: Metadata = { title: "Not found" };

// Shown for addresses that match no route at all.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col">
      <NotFoundContent />
    </main>
  );
}
