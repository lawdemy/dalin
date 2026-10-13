import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge treats unknown `text-*` / `shadow-*` classes as colours, so the
// custom size and shadow tokens from globals.css must be registered here or
// `text-caption` and `text-ink` would be merged into one.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "micro",
        "caption",
        "label",
        "body",
        "lead",
        "card-sm",
        "quote",
        "card",
        "section",
        "section-lg",
        "title",
        "title-lg",
      ],
      shadow: ["segment", "menu", "fab", "toast", "dialog"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
