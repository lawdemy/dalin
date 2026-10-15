import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { BottomNav } from "@/components/admin/bottom-nav";
import { requireMember } from "@/lib/auth";
import AdminLoading from "./loading";

export const metadata: Metadata = {
  title: "Diary",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="mx-auto w-full max-w-300 flex-1 px-5 pt-8 pb-10 md:px-6 md:pb-16">
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
 * proxy.ts (it covers direct visits; loading.tsx covers client navigations).
 * Layouts don't re-run on client navigation, so every admin page and Server
 * Action must still call requireMember() itself.
 */
async function MembersOnly({ children }: { children: ReactNode }) {
  await requireMember();
  return children;
}
