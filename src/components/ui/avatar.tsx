import { cn } from "@/lib/utils";

const sizes = {
  xs: "size-4.5 text-[0.625rem]",
  sm: "size-8 text-caption",
  md: "size-11 text-body",
} as const;

type AvatarProps = {
  name: string;
  size?: keyof typeof sizes;
  /** Alternate tone for the second partner. */
  tone?: "a" | "b";
  className?: string;
};

/** Initial in a circle. Photo avatars arrive with profiles in step 7. */
export function Avatar({ name, size = "sm", tone = "a", className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-avatar-ink",
        tone === "a" ? "bg-tone-2" : "bg-tone-4",
        sizes[size],
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
