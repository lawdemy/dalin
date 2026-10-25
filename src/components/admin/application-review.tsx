"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteApplication, saveReview } from "@/app/admin/foundation/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { APPLICATION_STATUSES, labelOf, type ApplicationStatus } from "@/lib/foundation";
import { cn } from "@/lib/utils";

const TONES: Record<ApplicationStatus, string> = {
  new: "bg-rose-tint text-danger-text",
  reviewing: "bg-private-tint text-ink-soft",
  shortlisted: "bg-tone-1 text-ink",
  approved: "bg-tone-3 text-ink",
  declined: "bg-linen text-muted",
  funded: "bg-ink text-ivory",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6.5 shrink-0 items-center rounded-full px-2.5 text-micro font-medium",
        TONES[status],
      )}
    >
      {labelOf(APPLICATION_STATUSES, status)}
    </span>
  );
}

type ReviewProps = {
  id: string;
  name: string;
  status: ApplicationStatus;
  amountApproved: number | null;
  reviewNotes: string | null;
  currency: string;
  documentCount: number;
};

/** Status, approved amount and private notes; plus deleting the application. */
export function ApplicationReview(props: ReviewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(props.status);
  const [amount, setAmount] = useState(props.amountApproved?.toString() ?? "");
  const [notes, setNotes] = useState(props.reviewNotes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function save() {
    setError(undefined);
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const res = await saveReview({
        id: props.id,
        status,
        amountApproved: amount.replace(/[,\s]/g, ""),
        reviewNotes: notes,
      });
      if (res.error) {
        setError(res.error);
        setErrors(res.fieldErrors ?? {});
      } else {
        setMessage("Saved.");
        router.refresh();
      }
    });
  }

  return (
    <section
      aria-labelledby="review-title"
      className="flex flex-col gap-4 rounded-xl bg-linen p-4 md:p-5"
    >
      <h2 id="review-title" className="text-section">
        Review
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="status" label="Status">
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="bg-ivory"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id="amountApproved"
            label={`Amount approved (${props.currency})`}
            error={errors.amountApproved}
          >
            <Input
              id="amountApproved"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={errors.amountApproved ? true : undefined}
              aria-describedby={describedBy("amountApproved", { error: errors.amountApproved })}
              className="bg-ivory"
            />
          </Field>
        </div>
        <Field
          id="reviewNotes"
          label="Private notes"
          hint="Calls made, school confirmation, payment details. Only the two of you see these."
          error={errors.reviewNotes}
        >
          <Textarea
            id="reviewNotes"
            rows={4}
            maxLength={5000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-describedby={describedBy("reviewNotes", { hint: true, error: errors.reviewNotes })}
            className="bg-ivory"
          />
        </Field>
        {error && (
          <p role="alert" className="text-caption text-danger-text">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ConfirmDialog
            title="Delete this application?"
            description={
              <>
                {props.name}&rsquo;s application
                {props.documentCount > 0 &&
                  ` and its ${props.documentCount} document${props.documentCount === 1 ? "" : "s"}`}{" "}
                will be deleted for good. Do this when the applicant asks, or when you no longer
                need it.
              </>
            }
            onConfirm={() => deleteApplication(props.id)}
            trigger={(open) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={open}
                className="px-1 text-danger-text hover:text-danger-text"
              >
                <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
                Delete application
              </Button>
            )}
          />
          <div className="flex items-center gap-3">
            <span aria-live="polite" className="text-caption text-muted">
              {message}
            </span>
            <Button type="submit" pending={pending}>
              Save review
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
