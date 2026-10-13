import { format, parseISO } from "date-fns";
import { CATEGORIES, MOODS, TIME_ZONE, type Category, type Mood } from "@/lib/constants";

/** "Sun 11 Oct 2026" from a yyyy-mm-dd date. */
export function formatEntryDate(date: string) {
  return format(parseISO(date), "EEE d MMM yyyy");
}

/** "11 October 2026" from a yyyy-mm-dd date. */
export function formatLongDate(date: string) {
  return format(parseISO(date), "d MMMM yyyy");
}

export function categoryLabel(category: Category) {
  return CATEGORIES.find((c) => c.value === category)?.label ?? "Other";
}

export function moodInfo(mood: Mood | null) {
  return mood ? (MOODS.find((m) => m.value === mood) ?? null) : null;
}

/** "Sun 11 Oct 2026 · Family" */
export function entryMeta(date: string, category: Category) {
  return `${formatEntryDate(date)} · ${categoryLabel(category)}`;
}

/** Today's date (yyyy-mm-dd) in the diary's time zone. */
export function todayInDiary(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}
