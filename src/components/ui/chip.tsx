import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ChipProps = Omit<ComponentProps<"button">, "aria-pressed"> & {
  selected?: boolean;
  /** md = 40px filter chips, lg = 44px chips in the entry form. */
  size?: "md" | "lg";
};

/** Pill toggle for filters and pickers. */
export function Chip({
  selected = false,
  size = "md",
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border text-label font-medium transition-colors",
        size === "md" ? "h-10 px-3.5" : "h-11 px-4",
        selected
          ? "border-ink bg-ink text-ivory"
          : "border-line bg-transparent text-ink hover:bg-linen",
        className,
      )}
      {...props}
    />
  );
}

/** Read-only label, e.g. the category on an entry. */
export function Tag({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center self-start rounded-full bg-linen px-3 text-caption font-medium text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}
