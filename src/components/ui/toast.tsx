"use client";

import { Check } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastOptions = {
  message: string;
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it hides. Default 5000. */
  duration?: number;
};

type ToastViewProps = ToastOptions & { onDismiss?: () => void; className?: string };

/** The dark pill on its own; ToastProvider positions and times it. */
export function ToastView({ message, action, onDismiss, className }: ToastViewProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl bg-ink py-1 pr-1 pl-4 text-label text-ivory shadow-toast",
        className,
      )}
    >
      <span className="flex items-center gap-2 py-2.5">
        <Check aria-hidden className="size-4 shrink-0 text-accent-light" strokeWidth={2} />
        {message}
      </span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            onDismiss?.();
          }}
          className="h-11 shrink-0 rounded-lg px-3 font-semibold text-accent-light hover:bg-white/10"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

const ToastContext = createContext<((toast: ToastOptions) => void) | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

/** Shows one toast at a time, above the bottom tab bar. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    clearTimeout(timer.current);
    setToast({ ...options, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), options.duration ?? 5000);
  }, []);

  useLayoutEffect(() => dismiss, [dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(108px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm"
      >
        {toast && (
          <ToastView
            key={toast.id}
            {...toast}
            onDismiss={dismiss}
            className="pointer-events-auto"
          />
        )}
      </div>
    </ToastContext.Provider>
  );
}
