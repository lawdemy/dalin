import { z } from "zod";
import {
  BOOK_STATUSES,
  CATEGORIES,
  MOODS,
  VISION_STATUSES,
  type BookStatus,
  type Category,
  type Mood,
  type VisionStatus,
} from "@/lib/constants";
import {
  AFRICAN_COUNTRIES,
  APPLICATION_STATUSES,
  CURRENCIES,
  FEE_PERIODS,
  LEVELS,
  SCHOOL_TYPES,
  SUPPORT_TYPES,
  TERTIARY_LEVELS,
  ageOn,
  type CountryCode,
} from "@/lib/foundation";

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
  /** The draft this entry was written in; deleted once the entry is saved. */
  draftId: z.uuid().optional(),
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

// Vision board (migration 0013) ----------------------------------------------------------

const visionStatusValues = VISION_STATUSES.map((s) => s.value) as [VisionStatus, ...VisionStatus[]];

export const visionSchema = z.object({
  id: z.uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Describe the vision.")
    .max(200, "Keep it under 200 characters; the details can go below."),
  // Free text on purpose: a vision can be about any area of life.
  area: z
    .string()
    .trim()
    .min(1, "Name the area of life, in any words you like.")
    .max(60, "Keep the area under 60 characters."),
  forWhom: z.enum(["family", "me"]),
  description: optionalText(5000, "Keep it under 5,000 characters."),
  targetDate: optionalDate,
  status: z.enum(visionStatusValues),
  achievedOn: optionalDate,
  photoId: z.uuid().nullable(),
});

export type VisionInput = z.input<typeof visionSchema>;

// Drafts (migration 0010) ----------------------------------------------------------------
// Drafts hold unfinished work, so nothing is required; only sizes are limited.

export const DRAFT_KINDS = ["entry", "note", "comment", "note_reply", "book_note"] as const;
export type DraftKind = (typeof DRAFT_KINDS)[number];

/** Kinds tied to something that already exists (an entry, a note, a book). */
export const TARGETED_DRAFT_KINDS: readonly DraftKind[] = ["comment", "note_reply", "book_note"];

const draftText = (max: number) => z.string().max(max).catch("");
const draftDate = z.union([z.iso.date(), z.literal("")]).catch("");

export const draftPayloadSchemas = {
  entry: z.object({
    title: draftText(140),
    entryDate: draftDate,
    location: draftText(120),
    mood: z.enum(moodValues).nullable().catch(null),
    category: z.enum(categoryValues).catch("everyday"),
    body: z.unknown(),
    visibility: z.enum(["private", "public"]).catch("private"),
    photos: z.array(z.object({ id: z.uuid(), caption: draftText(300) })).max(60),
    coverPhotoId: z.uuid().nullable().catch(null),
  }),
  note: z.object({ message: draftText(1000), deliverOn: draftDate }),
  comment: z.object({ body: draftText(2000) }),
  note_reply: z.object({ reply: draftText(1000) }),
  book_note: z.object({ chapter: draftText(80), body: draftText(2000) }),
} satisfies Record<DraftKind, z.ZodType>;

export type DraftPayload<K extends DraftKind> = z.output<(typeof draftPayloadSchemas)[K]>;

// Foundation applications (migration 0012) -----------------------------------------------

const req = (label: string, max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(
      min,
      min > 1 ? `${label}: please write at least ${min} characters.` : `${label} is required.`,
    )
    .max(max, `${label}: keep it under ${max.toLocaleString("en")} characters.`);
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max.toLocaleString("en")} characters.`)
    .transform((v) => v || null);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 ()-]{6,23}$/, "Enter a phone number, e.g. +234 803 123 4567.");
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email address.")
  .transform((v) => v || null);

const pick = <T extends readonly { value: string }[]>(list: T, message: string) =>
  z.enum(list.map((i) => i.value) as [T[number]["value"], ...T[number]["value"][]], { message });

export const applicationSchema = z
  .object({
    fullName: req("Full name", 120, 2),
    dateOfBirth: z.iso.date("Enter the date of birth."),
    gender: z.enum(["female", "male", ""]).transform((v) => v || null),
    nationality: z.enum(AFRICAN_COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]], {
      message: "Only nationals of African countries can apply.",
    }),
    countryOfResidence: req("Country of residence", 80, 2),
    stateRegion: opt(80),
    city: req("City or town", 80),
    email,
    phone,

    guardianName: opt(120),
    guardianRelationship: opt(60),
    guardianPhone: z
      .string()
      .trim()
      .transform((v) => v || null)
      .pipe(phone.nullable()),
    guardianEmail: email,

    level: pick(LEVELS, "Choose a level of study."),
    classYear: req("Class or year", 60),
    schoolName: req("School name", 160, 2),
    schoolType: pick(SCHOOL_TYPES, "Choose public or private."),
    schoolCity: req("School city or town", 80),
    schoolCountry: req("School country", 80, 2),
    course: opt(160),
    recentResults: req("Recent results", 2000, 2),
    achievements: opt(2000),

    supportType: pick(SUPPORT_TYPES, "Choose the support you're applying for."),
    amountRequested: z.coerce
      .number({ message: "Enter the amount needed." })
      .positive("Enter the amount needed.")
      .max(999_999_999_999, "That amount is too large."),
    currency: z.enum(CURRENCIES, { message: "Choose a currency." }),
    feePeriod: pick(FEE_PERIODS, "Choose what the amount covers."),
    feeBreakdown: opt(2000),
    otherSupport: opt(1000),
    financialSituation: req("Family's financial situation", 3000, 20),
    statement: req("Personal statement", 5000, 50),
    heardFrom: opt(200),

    consent: z.literal(true, { message: "Please confirm the declaration to apply." }),
    guardianConsent: z.boolean(),
    // Spam traps: a hidden field people leave empty, and the time the form was opened.
    website: z.string().max(0).optional(),
    startedAt: z.number().int(),
  })
  .superRefine((a, ctx) => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
    if (a.dateOfBirth > today)
      ctx.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "That date is in the future.",
      });
    if (ageOn(a.dateOfBirth, today) < 18) {
      if (!a.guardianName)
        ctx.addIssue({
          code: "custom",
          path: ["guardianName"],
          message: "A parent or guardian must apply for under-18s.",
        });
      if (!a.guardianRelationship)
        ctx.addIssue({
          code: "custom",
          path: ["guardianRelationship"],
          message: "Say how you're related to the student.",
        });
      if (!a.guardianPhone)
        ctx.addIssue({
          code: "custom",
          path: ["guardianPhone"],
          message: "Enter the parent or guardian's phone number.",
        });
      if (!a.guardianConsent)
        ctx.addIssue({
          code: "custom",
          path: ["guardianConsent"],
          message: "The parent or guardian must give consent.",
        });
    }
    if (TERTIARY_LEVELS.includes(a.level) && !a.course)
      ctx.addIssue({
        code: "custom",
        path: ["course"],
        message: "Enter your course or programme.",
      });
  });

export type ApplicationInput = z.input<typeof applicationSchema>;

export const applicationReviewSchema = z.object({
  id: z.uuid(),
  status: pick(APPLICATION_STATUSES, "Choose a status."),
  amountApproved: z
    .union([z.literal(""), z.coerce.number().min(0, "Enter 0 or more.")])
    .transform((v) => (v === "" ? null : v)),
  reviewNotes: opt(5000),
});
