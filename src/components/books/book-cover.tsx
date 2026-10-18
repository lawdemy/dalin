import { placeholderTone } from "@/components/ui/photo-tile";
import { cn } from "@/lib/utils";

type BookCoverProps = {
  title: string;
  author: string;
  size?: "sm" | "md";
  className?: string;
};

/** A plain typographic cover: we don't host book images, only the title and author. */
export function BookCover({ title, author, size = "md", className }: BookCoverProps) {
  // Same book, same tone, on every page.
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex shrink-0 flex-col justify-between overflow-hidden rounded-l-md rounded-r-xl text-tone-ink",
        placeholderTone(hash),
        size === "md" ? "h-40 w-28 p-3" : "h-24 w-17 p-2",
        className,
      )}
    >
      {/* spine */}
      <span className="absolute inset-y-0 left-0 w-1.5 bg-ink/10" />
      <span
        className={cn(
          "line-clamp-4 font-serif leading-tight font-semibold",
          size === "md" ? "text-[1.0625rem]" : "text-[0.75rem]",
        )}
      >
        {title}
      </span>
      <span
        className={cn(
          "line-clamp-2 leading-tight",
          size === "md" ? "text-micro" : "text-[0.5625rem]",
        )}
      >
        {author}
      </span>
    </div>
  );
}
