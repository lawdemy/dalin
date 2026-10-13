"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

export type LightboxItem = {
  key: string;
  /** The full-size image, usually a next/image with `fill` and `object-contain`. */
  content: ReactNode;
  caption?: string;
};

type LightboxProps = {
  items: LightboxItem[];
  /** Index of the open photo, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  /** Total photos when `items` is one page of a longer list. */
  total?: number;
};

const SWIPE_THRESHOLD = 50;

/** Full-screen photo viewer: swipe on phones, arrow keys on desktop, Esc to close. */
export function Lightbox({ items, index, onIndexChange, total }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);
  const open = index !== null && items.length > 0;
  const current = open ? items[index] : null;
  const count = items.length;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close when Next hides this route (Activity keeps it mounted). The ref keeps
  // the cleanup from firing on every render when the callback is inline.
  const onIndexChangeRef = useRef(onIndexChange);
  useLayoutEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  });
  useLayoutEffect(() => () => onIndexChangeRef.current(null), []);

  function step(delta: number) {
    if (index === null) return;
    onIndexChange((index + delta + count) % count);
  }

  return (
    <dialog
      ref={ref}
      aria-label="Photo viewer"
      onClose={() => onIndexChange(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > SWIPE_THRESHOLD) step(dx < 0 ? 1 : -1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-night p-0 text-ivory backdrop:bg-night"
    >
      {current && (
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between pr-2 pl-5">
            <span className="text-caption text-night-muted">
              {index! + 1} of {total ?? count}
            </span>
            <button
              type="button"
              aria-label="Close photo viewer"
              onClick={() => onIndexChange(null)}
              className="flex size-11 items-center justify-center rounded-xl text-ivory hover:bg-white/10"
            >
              <X aria-hidden className="size-6" strokeWidth={1.8} />
            </button>
          </div>
          <div className="relative min-h-0 flex-1">{current.content}</div>
          <div className="flex flex-col gap-1 px-5 pt-4 pb-2">
            {current.caption && (
              <p className="font-serif text-card-sm font-semibold">{current.caption}</p>
            )}
            {count > 1 && <p className="text-caption text-night-muted">Swipe for the next photo</p>}
          </div>
          {count > 1 && (
            <div className="flex justify-between px-3 pt-2 pb-[calc(32px+env(safe-area-inset-bottom))]">
              <NavButton label="Previous photo" onClick={() => step(-1)}>
                <ChevronLeft aria-hidden className="size-6" strokeWidth={1.8} />
              </NavButton>
              <NavButton label="Next photo" onClick={() => step(1)}>
                <ChevronRight aria-hidden className="size-6" strokeWidth={1.8} />
              </NavButton>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-12 items-center justify-center rounded-full border border-ink-soft text-ivory hover:bg-white/10"
    >
      {children}
    </button>
  );
}
