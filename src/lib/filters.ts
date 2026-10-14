import { CATEGORIES, MOODS, type Category, type Mood } from "@/lib/constants";
import type { EntryFilters } from "@/lib/queries/entries";

type Params = Record<string, string | string[] | undefined>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Timeline filters from the URL. Anything malformed is ignored, never an error. */
export function parseEntryFilters(params: Params): EntryFilters {
  const q = one(params.q)?.trim().slice(0, 100);
  const vis = one(params.vis);
  const cat = one(params.cat);
  const mood = one(params.mood);
  const author = one(params.author);
  const from = one(params.from);
  const to = one(params.to);
  const limit = Number(one(params.limit));

  return {
    q: q || undefined,
    visibility: vis === "private" || vis === "public" ? vis : undefined,
    category: CATEGORIES.some((c) => c.value === cat) ? (cat as Category) : undefined,
    mood: MOODS.some((m) => m.value === mood) ? (mood as Mood) : undefined,
    author: author && UUID.test(author) ? author : undefined,
    from: from && DATE.test(from) ? from : undefined,
    to: to && DATE.test(to) ? to : undefined,
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 1000) : undefined,
  };
}

/** Back to URL params (only set values), e.g. for links and the filter bar. */
export function filtersToParams(f: EntryFilters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.visibility) p.set("vis", f.visibility);
  if (f.category) p.set("cat", f.category);
  if (f.mood) p.set("mood", f.mood);
  if (f.author) p.set("author", f.author);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.limit) p.set("limit", String(f.limit));
  return p;
}
