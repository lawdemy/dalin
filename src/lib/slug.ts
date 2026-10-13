/**
 * "Sunday lunch at Mama's" + 2026-10-11 → "sunday-lunch-at-mamas-2026-10-11".
 * Matches the entries_slug_check pattern: lowercase letters, digits, hyphens.
 */
export function slugFor(title: string, entryDate: string) {
  const words = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // é → e
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${words || "moment"}-${entryDate}`;
}

/** Adds -2, -3 … until the slug isn't in `taken`. */
export function uniqueSlug(base: string, taken: Iterable<string>) {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
