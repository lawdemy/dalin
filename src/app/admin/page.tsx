import { Plus } from "lucide-react";
import Link from "next/link";
import { NEW_ENTRY_HREF } from "@/components/admin/nav-items";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireMember } from "@/lib/auth";

// Dashboard shell; recent entries, counts and "On this day" arrive in step 5.
export default async function DashboardPage() {
  const member = await requireMember();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-section-lg leading-tight">Welcome back, {member.displayName}</h1>
      <Link
        href={NEW_ENTRY_HREF}
        className={buttonClasses({ size: "lg", fullWidth: true, className: "h-14" })}
      >
        <Plus aria-hidden className="size-5" strokeWidth={2} />
        New entry
      </Link>
      <EmptyState title="No entries yet" description="Your first page is waiting." />
    </div>
  );
}
