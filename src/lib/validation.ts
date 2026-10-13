import { z } from "zod";
import { CATEGORIES, MOODS, type Category, type Mood } from "@/lib/constants";

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
