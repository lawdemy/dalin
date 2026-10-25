import { Check, CloudOff, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DraftStatus as Status } from "./use-draft";

/** "Saving draft…" / "Draft saved", like Gmail's line under the composer. */
export function DraftStatus({
  status,
  error,
  className,
}: {
  status: Status;
  error?: string;
  className?: string;
}) {
  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex min-h-5 items-center gap-1 text-caption",
        status === "error" ? "text-danger-text" : "text-muted",
        className,
      )}
    >
      {status === "saving" && (
        <>
          <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={1.8} />
          Saving draft…
        </>
      )}
      {status === "saved" && (
        <>
          <Check aria-hidden className="size-3.5" strokeWidth={2} />
          Draft saved
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff aria-hidden className="size-3.5" strokeWidth={1.8} />
          {error ?? "Draft not saved"}
        </>
      )}
    </span>
  );
}
