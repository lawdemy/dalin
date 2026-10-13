"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Button } from "./button";

type ConfirmDialogProps = {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Runs on confirm; may be async (e.g. a Server Action). The dialog closes when it settles. */
  onConfirm: () => void | Promise<void>;
  /** Renders the element that opens the dialog. */
  trigger: (open: () => void) => ReactNode;
};

/** Destructive confirmation, e.g. "Delete this entry?". Uses the native <dialog>. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Next keeps hidden routes mounted (Activity); don't come back to an open dialog.
  useLayoutEffect(() => () => setOpen(false), []);

  function confirm() {
    startTransition(async () => {
      await onConfirm();
      setOpen(false);
    });
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="m-auto w-[min(360px,calc(100vw-32px))] rounded-2xl border border-sand bg-ivory p-6 text-ink shadow-dialog"
      >
        <h2 id={titleId} className="text-[1.75rem] leading-tight">
          {title}
        </h2>
        <div className="mt-3 text-ink-soft">{description}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={confirm} pending={pending}>
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
