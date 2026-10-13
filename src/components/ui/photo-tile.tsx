import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = ["bg-tone-1", "bg-tone-2", "bg-tone-3", "bg-tone-4", "bg-tone-5", "bg-tone-6"];

/** Placeholder fill for a photo slot (also used while an image loads). */
export function placeholderTone(index: number) {
  return tones[index % tones.length];
}

type PhotoTileProps = Omit<ComponentProps<"div">, "children"> & {
  /** The image, usually a next/image with `fill`. Empty shows a placeholder tone. */
  children?: ReactNode;
  /** Upload progress 0–100; shows an overlay while defined. */
  progress?: number;
  selected?: boolean;
  /** Square tile; otherwise size it with className (e.g. masonry heights). */
  square?: boolean;
  tone?: number;
};

export function PhotoTile({
  children,
  progress,
  selected = false,
  square = true,
  tone = 0,
  className,
  ...props
}: PhotoTileProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        square && "aspect-square",
        placeholderTone(tone),
        className,
      )}
      {...props}
    >
      {children}
      {progress !== undefined && (
        <div
          role="progressbar"
          aria-label="Uploading"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute inset-0 flex items-center justify-center bg-ink/45 text-micro font-semibold text-white"
        >
          {Math.round(progress)}%
        </div>
      )}
      {/* Inset ring sits above the image. */}
      {selected && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-xl ring-3 ring-accent-dark ring-inset"
        />
      )}
    </div>
  );
}
