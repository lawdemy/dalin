import { cn } from "@/lib/utils";
import { CloudImage, type ImageSource } from "./cloud-image";

const sizes = {
  xs: "size-4.5 text-[0.625rem]",
  sm: "size-8 text-caption",
  md: "size-11 text-body",
  lg: "size-20 text-section",
} as const;

const pixels = { xs: "18px", sm: "32px", md: "44px", lg: "80px" } as const;

type AvatarProps = {
  name: string;
  size?: keyof typeof sizes;
  /** Alternate tone for the second partner. */
  tone?: "a" | "b";
  /** Signed profile photo; falls back to the initial. */
  image?: ImageSource[] | null;
  className?: string;
};

/** Profile photo, or the first initial in a circle. */
export function Avatar({ name, size = "sm", tone = "a", image, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-avatar-ink",
        tone === "a" ? "bg-tone-2" : "bg-tone-4",
        sizes[size],
        className,
      )}
    >
      {image?.length ? (
        <CloudImage sources={image} alt="" fill sizes={pixels[size]} className="object-cover" />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}
