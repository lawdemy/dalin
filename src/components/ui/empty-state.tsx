import { BookOpen, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Optional call to action, e.g. a "Write about it" button. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = BookOpen,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-stitch px-4 py-6 text-center",
        className,
      )}
    >
      <Icon aria-hidden className="size-6 text-accent" strokeWidth={1.5} />
      <p className="font-serif text-card-sm font-semibold">{title}</p>
      {description && <p className="text-label text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
