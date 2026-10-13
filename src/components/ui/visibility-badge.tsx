import { Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type Visibility = "private" | "public";

const styles: Record<Visibility, string> = {
  private: "bg-private-tint text-ink-soft",
  public: "bg-rose-tint text-danger-text",
};

const labels: Record<Visibility, string> = { private: "Private", public: "Public" };

type VisibilityBadgeProps = {
  visibility: Visibility;
  /** Icon-only circle, as used in timeline rows. */
  compact?: boolean;
  className?: string;
};

export function VisibilityBadge({ visibility, compact = false, className }: VisibilityBadgeProps) {
  const Icon = visibility === "public" ? Globe : Lock;

  if (compact) {
    return (
      <span
        role="img"
        aria-label={labels[visibility]}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          styles[visibility],
          className,
        )}
      >
        <Icon aria-hidden className="size-4" strokeWidth={1.8} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-6.5 shrink-0 items-center gap-1 rounded-full px-2.5 text-micro font-medium",
        styles[visibility],
        className,
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={2} />
      {labels[visibility]}
    </span>
  );
}
