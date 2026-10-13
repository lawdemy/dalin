import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = ComponentProps<"div"> & {
  /** filled = linen background, outline = 1px sand border. */
  variant?: "filled" | "outline";
};

export function Card({ variant = "filled", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl",
        variant === "filled" ? "bg-linen" : "border border-sand",
        className,
      )}
      {...props}
    />
  );
}

type EntryCardProps = {
  /** Cover image (or placeholder); sized by the card. */
  media: ReactNode;
  /** e.g. "Sun 11 Oct 2026 · Family" */
  meta: string;
  title: string;
  /** featured = image on top; row = square thumbnail beside the text. */
  layout?: "featured" | "row";
  /** Optional extra on the right of a row, e.g. a visibility badge. */
  aside?: ReactNode;
  className?: string;
};

/** Presentational entry card; wrap it in a <Link> where it should navigate. */
export function EntryCard({
  media,
  meta,
  title,
  layout = "featured",
  aside,
  className,
}: EntryCardProps) {
  if (layout === "row") {
    return (
      <div className={cn("flex items-center gap-4 text-ink", className)}>
        <div className="size-24 shrink-0 overflow-hidden rounded-xl">{media}</div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-caption text-muted">{meta}</span>
          <span className="font-serif text-card-sm font-semibold">{title}</span>
        </div>
        {aside}
      </div>
    );
  }

  return (
    <Card className={cn("flex flex-col text-ink", className)}>
      <div className="h-52.5 overflow-hidden">{media}</div>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-caption text-muted">{meta}</span>
        <span className="font-serif text-card font-semibold">{title}</span>
      </div>
    </Card>
  );
}
