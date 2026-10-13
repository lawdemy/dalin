import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  /** id of the control inside; ties the label, hint and error to it. */
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Label above a control, with an optional hint or error below.
 * Give the control `id={id}` and `aria-describedby={describedBy(id, …)}`.
 */
export function Field({ id, label, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label font-medium">
        {label}
        {required && (
          <span aria-hidden className="text-accent-dark">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-caption text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** The aria-describedby value matching what <Field> renders. */
export function describedBy(id: string, { hint, error }: { hint?: unknown; error?: unknown }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
