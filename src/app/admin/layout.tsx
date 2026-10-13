import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { BottomNav } from "@/components/admin/bottom-nav";
import { requireMember } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Diary",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="mx-auto w-full max-w-300 flex-1 px-5 pt-8 pb-[calc(140px+env(safe-area-inset-bottom))] md:px-6 md:pb-16">
        <Suspense fallback={<AdminLoading />}>
          <MembersOnly>{children}</MembersOnly>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}

/**
 * Renders the page only for a signed-in member. This is the second gate after
 * proxy.ts. Layouts don't re-run on client navigation, so every admin page and
 * Server Action must still call requireMember() itself.
 */
async function MembersOnly({ children }: { children: ReactNode }) {
  await requireMember();
  return children;
}

function AdminLoading() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-linen" />
      <div className="h-14 animate-pulse rounded-xl bg-linen" />
      <div className="h-32 animate-pulse rounded-xl bg-linen" />
    </div>
  );
}
