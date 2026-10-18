// Fallbacks until the names and welcome line are read from site_settings (step 6).
export const SITE_NAME = "Daniel & Linda";
export const SITE_TAGLINE = "Written together, one day at a time.";

/** "Today" for new entries is the date in Lagos. */
export const TIME_ZONE = "Africa/Lagos";

export const PUBLIC_NAV = [
  { href: "/about", label: "About us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/moments", label: "Moments" },
  { href: "/books", label: "Bookshelf" },
] as const;

// Labels for the entry_mood and entry_category enums (migration 0004).
// Order is the order shown in pickers.
export const MOODS = [
  { value: "loved", label: "Loved", emoji: "🥰" },
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "funny", label: "Funny", emoji: "😂" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "bittersweet", label: "Bittersweet", emoji: "🥲" },
  { value: "sad", label: "Sad", emoji: "😢" },
] as const;

export const CATEGORIES = [
  { value: "everyday", label: "Everyday" },
  { value: "date_night", label: "Date night" },
  { value: "travel", label: "Travel" },
  { value: "milestone", label: "Milestone" },
  { value: "food", label: "Food" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

export type Mood = (typeof MOODS)[number]["value"];
export type Category = (typeof CATEGORIES)[number]["value"];

// Labels for the book_status enum (migration 0009), in shelf order.
export const BOOK_STATUSES = [
  { value: "reading", label: "Reading now" },
  { value: "finished", label: "Finished" },
  { value: "want_to_read", label: "Up next" },
] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number]["value"];
