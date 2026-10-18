import { z } from "zod";
import {
  BOOK_STATUSES,
  CATEGORIES,
  MOODS,
  type BookStatus,
  type Category,
  type Mood,
} from "@/lib/constants";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
  // Where to go after signing in; only admin paths are allowed.
  next: z
    .string()
    .optional()
    .transform((v) => (v && /^\/admin(?:[/?#]|$)/.test(v) && !v.startsWith("//") ? v : "/admin")),
});

const moodValues = MOODS.map((m) => m.value) as [Mood, ...Mood[]];
const categoryValues = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];

/** What the entry editor sends to saveEntry. The body is cleaned separately. */
export const entrySchema = z.object({
  id: z.uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Give the day a name.")
    .max(140, "Keep the title under 140 characters."),
  entryDate: z.iso.date("Pick the day it happened."),
  location: z
    .string()
    .trim()
    .max(120, "Keep the location under 120 characters.")
    .transform((v) => v || null),
  mood: z.enum(moodValues).nullable(),
  category: z.enum(categoryValues),
  body: z.unknown(),
  visibility: z.enum(["private", "public"]),
  photos: z
    .array(
      z.object({
        id: z.uuid(),
        caption: z
          .string()
          .trim()
          .max(300)
          .transform((v) => v || null),
      }),
    )
    .max(60, "An entry can have up to 60 photos."),
  coverPhotoId: z.uuid().nullable(),
});

export type EntryInput = z.input<typeof entrySchema>;

/** After an upload: the public_id Cloudinary stored, plus browser-read extras. */
export const registerPhotoSchema = z.object({
  publicId: z.string().regex(/^dalin\/photos\/\d{4}\/\d{2}\/[0-9a-f-]{36}$/),
  takenAt: z.iso.datetime({ offset: true }).nullable(),
  blurDataUrl: z
    .string()
    .max(4000)
    .regex(/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/)
    .nullable(),
});

const bookStatusValues = BOOK_STATUSES.map((s) => s.value) as [BookStatus, ...BookStatus[]];

/** Empty text → null, so optional fields clear in the database. */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || null);

const optionalDate = z
  .union([z.iso.date("Pick a valid date."), z.literal("")])
  .transform((v) => v || null);

/** What the book form sends to saveBook. */
export const bookSchema = z
  .object({
    id: z.uuid().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Add the book's title.")
      .max(200, "Keep the title under 200 characters."),
    author: z
      .string()
      .trim()
      .min(1, "Add the author.")
      .max(200, "Keep the author under 200 characters."),
    status: z.enum(bookStatusValues),
    startedOn: optionalDate,
    finishedOn: optionalDate,
    buyUrl: z
      .string()
      .trim()
      .max(500, "That link is too long.")
      .refine((v) => !v || /^https:\/\/[^\s/]+\.[^\s]+$/i.test(v), "Use a full https:// link.")
      .transform((v) => v || null),
    quote: optionalText(400, "Keep the quote under 400 characters, a sentence or two."),
    reflection: optionalText(3000, "Keep it under 3,000 characters."),
    visibility: z.enum(["private", "public"]),
  })
  .refine((b) => !b.startedOn || !b.finishedOn || b.finishedOn >= b.startedOn, {
    message: "The finish date can't be before the start date.",
    path: ["finishedOn"],
  });

export type BookInput = z.input<typeof bookSchema>;

export const bookNoteSchema = z.object({
  chapter: optionalText(80, "Keep the chapter under 80 characters."),
  body: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(2000, "Keep it under 2,000 characters."),
});
