"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type LightboxItem = {
  key: string;
  /**
   * The full-size image, usually a next/image with `fill` and `object-contain`.
   * A function receives the current zoom so it can load a sharper size.
   */
  content: ReactNode | ((zoom: number) => ReactNode);
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
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_MS = 300;

type Point = { x: number; y: number };

/**
 * Full-screen photo viewer. Swipe or arrow keys for the next photo, Esc to
 * close. Zoom with the buttons, double-click / double-tap, the mouse wheel,
 * a two-finger pinch, or + / − / 0; drag to look around while zoomed.
 */
export function Lightbox({ items, index, onIndexChange, total }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const open = index !== null && items.length > 0;
  const current = open ? items[index] : null;
  const count = items.length;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Each photo opens unzoomed.
  const [shownIndex, setShownIndex] = useState(index);
  if (shownIndex !== index) {
    setShownIndex(index);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

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

  /** Keeps the zoomed photo from being dragged off screen. */
  function clampPan(p: Point, z: number): Point {
    const rect = stage.current?.getBoundingClientRect();
    if (!rect || z <= 1) return { x: 0, y: 0 };
    const maxX = (rect.width * (z - 1)) / 2;
    const maxY = (rect.height * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, p.x)),
      y: Math.max(-maxY, Math.min(maxY, p.y)),
    };
  }

  /** Zooms to `next`, keeping the point under `origin` (screen coords) still. */
  function zoomTo(next: number, origin?: Point) {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    const rect = stage.current?.getBoundingClientRect();
    if (!rect || z === 1) {
      setZoom(z);
      setPan({ x: 0, y: 0 });
      return;
    }
    const o = origin ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const p = { x: o.x - (rect.left + rect.width / 2), y: o.y - (rect.top + rect.height / 2) };
    const ratio = z / zoom;
    setZoom(z);
    setPan(clampPan({ x: p.x - (p.x - pan.x) * ratio, y: p.y - (p.y - pan.y) * ratio }, z));
  }

  // Pointer handling: drag to pan, pinch to zoom, double-tap, swipe.
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    start: Point;
    startPan: Point;
    startZoom: number;
    startDistance: number;
    moved: boolean;
  } | null>(null);
  const lastTap = useRef<{ time: number; point: Point } | null>(null);

  function distance() {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  function midpoint(): Point {
    const [a, b] = [...pointers.current.values()];
    return b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
  }

  function onPointerDown(e: ReactPointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = {
      start: midpoint(),
      startPan: pan,
      startZoom: zoom,
      startDistance: distance(),
      moved: false,
    };
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const m = midpoint();
    if (Math.hypot(m.x - g.start.x, m.y - g.start.y) > 6) g.moved = true;

    if (pointers.current.size === 2 && g.startDistance > 0) {
      // Pinch: scale from the gesture's starting zoom.
      const z = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, (g.startZoom * distance()) / g.startDistance),
      );
      setZoom(z);
      setPan(clampPan(g.startPan, z));
    } else if (zoom > 1) {
      setPan(
        clampPan({ x: g.startPan.x + m.x - g.start.x, y: g.startPan.y + m.y - g.start.y }, zoom),
      );
    }
  }

  function onPointerUp(e: ReactPointerEvent) {
    const g = gesture.current;
    const start = g?.start;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) {
      // One finger lifted mid-pinch: restart the gesture from the other.
      gesture.current = {
        start: midpoint(),
        startPan: pan,
        startZoom: zoom,
        startDistance: 0,
        moved: true,
      };
      return;
    }
    gesture.current = null;
    setDragging(false);
    if (!g || !start) return;

    const dx = e.clientX - start.x;
    if (!g.moved) {
      // Tap: a second tap soon after toggles zoom at that point.
      const now = Date.now();
      const point = { x: e.clientX, y: e.clientY };
      if (lastTap.current && now - lastTap.current.time < DOUBLE_TAP_MS) {
        zoomTo(zoom > 1 ? 1 : 2.5, point);
        lastTap.current = null;
      } else {
        lastTap.current = { time: now, point };
      }
    } else if (zoom === 1 && g.startZoom === 1 && Math.abs(dx) > SWIPE_THRESHOLD && count > 1) {
      step(dx < 0 ? 1 : -1);
    }
  }

  const content = current
    ? typeof current.content === "function"
      ? current.content(zoom)
      : current.content
    : null;

  return (
    <dialog
      ref={ref}
      aria-label="Photo viewer"
      onClose={() => onIndexChange(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        else if (e.key === "ArrowRight") step(1);
        else if (e.key === "+" || e.key === "=") zoomTo(zoom * 1.5);
        else if (e.key === "-" || e.key === "_") zoomTo(zoom / 1.5);
        else if (e.key === "0") zoomTo(1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-night p-0 text-ivory backdrop:bg-night"
    >
      {current && (
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between gap-2 pr-2 pl-5">
            <span className="text-caption text-night-muted">
              {index! + 1} of {total ?? count}
            </span>
            <div className="flex items-center gap-1">
              <ToolButton
                label="Zoom out"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => zoomTo(zoom / 1.5)}
              >
                <ZoomOut aria-hidden className="size-5.5" strokeWidth={1.8} />
              </ToolButton>
              <span className="w-11 text-center text-caption text-night-muted" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <ToolButton
                label="Zoom in"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => zoomTo(zoom * 1.5)}
              >
                <ZoomIn aria-hidden className="size-5.5" strokeWidth={1.8} />
              </ToolButton>
              <ToolButton label="Close photo viewer" onClick={() => onIndexChange(null)}>
                <X aria-hidden className="size-6" strokeWidth={1.8} />
              </ToolButton>
            </div>
          </div>

          <div
            ref={stage}
            className={cn(
              "relative min-h-0 flex-1 touch-none overflow-hidden select-none",
              zoom > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(e) =>
              zoomTo(zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2), { x: e.clientX, y: e.clientY })
            }
          >
            <div
              className={cn(
                "absolute inset-0",
                !dragging && "transition-transform duration-200 ease-out",
              )}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {content}
            </div>
          </div>

          <div className="flex flex-col gap-1 px-5 pt-4 pb-2">
            {current.caption && (
              <p className="font-serif text-card-sm font-semibold">{current.caption}</p>
            )}
            <p className="text-caption text-night-muted">
              {zoom > 1
                ? "Drag to look around. Double-tap to zoom out."
                : count > 1
                  ? "Double-tap to zoom. Swipe for the next photo."
                  : "Double-tap or pinch to zoom."}
            </p>
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

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-11 items-center justify-center rounded-xl text-ivory hover:bg-white/10 disabled:opacity-35"
    >
      {children}
    </button>
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
