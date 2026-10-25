"use server";

import { z } from "zod";
import {
  createDocumentTicket,
  destroyAssets,
  isApplicationDocumentId,
  verifyDocument,
  type UploadTicket,
} from "@/lib/cloudinary";
import { DOCUMENT_KINDS, MAX_DOCUMENTS, type DocumentKind } from "@/lib/foundation";
import { pushSoon } from "@/lib/push";
import { createPublicClient } from "@/lib/supabase/public";
import { applicationSchema, type ApplicationInput } from "@/lib/validation";

/*
 * Public side of the foundation. Visitors can't read applications; they can
 * only submit one and then attach documents with the one-time token it
 * returns. Everything goes through the anonymous Supabase client, so the
 * database functions in migration 0012 have the last word.
 */

export type SubmitResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  application?: { id: string; reference: string; token: string };
};

/** Fastest believable time to fill in the form; quicker is a bot. */
const MIN_FILL_MS = 20_000;

export async function submitApplication(input: ApplicationInput): Promise<SubmitResult> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Please check the highlighted answers.", fieldErrors };
  }
  const a = parsed.data;
  // Quietly turn away bots: they fill the hidden field or submit instantly.
  if (a.website || Date.now() - a.startedAt < MIN_FILL_MS) {
    return { error: "Something went wrong. Please wait a moment and try again." };
  }

  const db = createPublicClient();
  if (!db) return { error: "Applications aren't open yet. Please try again later." };

  const { data, error } = await db.rpc("submit_application", {
    p: {
      full_name: a.fullName,
      date_of_birth: a.dateOfBirth,
      gender: a.gender,
      nationality: a.nationality,
      country_of_residence: a.countryOfResidence,
      state_region: a.stateRegion,
      city: a.city,
      email: a.email,
      phone: a.phone,
      guardian_name: a.guardianName,
      guardian_relationship: a.guardianRelationship,
      guardian_phone: a.guardianPhone,
      guardian_email: a.guardianEmail,
      level: a.level,
      class_year: a.classYear,
      school_name: a.schoolName,
      school_type: a.schoolType,
      school_city: a.schoolCity,
      school_country: a.schoolCountry,
      course: a.course,
      recent_results: a.recentResults,
      achievements: a.achievements,
      support_type: a.supportType,
      amount_requested: a.amountRequested,
      currency: a.currency,
      fee_period: a.feePeriod,
      fee_breakdown: a.feeBreakdown,
      other_support: a.otherSupport,
      financial_situation: a.financialSituation,
      statement: a.statement,
      heard_from: a.heardFrom,
    },
  });

  if (error) {
    if (error.code === "P0002")
      return {
        error: "We've already received 3 applications from you today. Please try tomorrow.",
      };
    if (error.code === "P0003")
      return { error: "We're receiving a lot of applications today. Please try again tomorrow." };
    if (error.code === "P0001")
      return {
        error: "A parent or guardian must apply for students under 18.",
        fieldErrors: { guardianName: "A parent or guardian must apply for under-18s." },
      };
    if (error.code === "PGRST202" || error.code === "42883")
      return { error: "Applications aren't open yet. Please try again later." };
    console.error("submit_application failed", error.message);
    return { error: "We couldn't send your application. Please try again." };
  }

  pushSoon(); // tell Daniel and Linda
  const r = data as { id: string; reference: string; token: string };
  return { application: { id: r.id, reference: r.reference, token: r.token } };
}

const ticketRequest = z.object({
  applicationId: z.uuid(),
  token: z.string().regex(/^[0-9a-f]{48}$/),
  types: z
    .array(z.enum(["image", "pdf"]))
    .min(1)
    .max(MAX_DOCUMENTS),
});

/** One signed upload per document, while the application's token is valid. */
export async function getDocumentTickets(
  input: z.input<typeof ticketRequest>,
): Promise<{ tickets?: UploadTicket[]; error?: string }> {
  const parsed = ticketRequest.safeParse(input);
  if (!parsed.success) return { error: "Those files couldn't be prepared." };
  const { applicationId, token, types } = parsed.data;
  const db = createPublicClient();
  if (!db) return { error: "Uploads aren't available right now." };
  const { data: slots, error } = await db.rpc("application_upload_slots", {
    p_application: applicationId,
    p_token: token,
  });
  if (error || typeof slots !== "number" || slots < 1)
    return { error: "The time for adding documents to this application has passed." };
  return { tickets: types.slice(0, slots).map((t) => createDocumentTicket(applicationId, t)) };
}

const confirmRequest = z.object({
  applicationId: z.uuid(),
  token: z.string().regex(/^[0-9a-f]{48}$/),
  publicId: z.string().max(200),
  kind: z.enum(DOCUMENT_KINDS.map((k) => k.value) as [DocumentKind, ...DocumentKind[]]),
  name: z.string().max(200),
});

/** Records an uploaded document after checking the file with Cloudinary. */
export async function confirmDocument(
  input: z.input<typeof confirmRequest>,
): Promise<{ error?: string }> {
  const parsed = confirmRequest.safeParse(input);
  if (!parsed.success) return { error: "That file couldn't be recorded." };
  const { applicationId, token, publicId, kind, name } = parsed.data;
  if (!isApplicationDocumentId(publicId, applicationId))
    return { error: "That file couldn't be recorded." };

  const db = createPublicClient();
  if (!db) return { error: "Uploads aren't available right now." };
  // Only the applicant (holding the token) may add, or cause us to delete, a file.
  const { data: slots } = await db.rpc("application_upload_slots", {
    p_application: applicationId,
    p_token: token,
  });
  if (typeof slots !== "number" || slots < 1)
    return { error: "The time for adding documents to this application has passed." };

  const asset = await verifyDocument(publicId);
  if (!asset) {
    await destroyAssets([publicId]);
    return { error: `${name} isn't a PDF or photo under 10 MB.` };
  }
  const { error } = await db.rpc("add_application_document", {
    p_application: applicationId,
    p_token: token,
    p_kind: kind,
    p_public_id: publicId,
    p_format: asset.format,
    p_bytes: asset.bytes,
    p_pages: asset.pages,
    p_width: asset.width,
    p_height: asset.height,
    p_name: name,
  });
  if (error) {
    await destroyAssets([publicId]);
    return { error: `${name} couldn't be added. The upload time may have run out.` };
  }
  return {};
}
