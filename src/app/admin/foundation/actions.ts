"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { destroyAssets } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";
import { applicationReviewSchema } from "@/lib/validation";

export type ReviewResult = { error?: string; fieldErrors?: Record<string, string> };

/** Saves the status, approved amount and private notes on an application. */
export async function saveReview(
  input: z.input<typeof applicationReviewSchema>,
): Promise<ReviewResult> {
  const me = await requireMember();
  const parsed = applicationReviewSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Check the highlighted fields.", fieldErrors };
  }
  const { id, status, amountApproved, reviewNotes } = parsed.data;
  const db = await createClient();
  const { data, error } = await db
    .from("scholarship_applications")
    .update({
      status,
      amount_approved: amountApproved,
      review_notes: reviewNotes,
      reviewed_by: me.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { error: "Couldn't save the review. Try again." };
  revalidatePath("/admin/foundation");
  return {};
}

/** Deletes an application and its documents for good (e.g. when the applicant asks). */
export async function deleteApplication(id: string) {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return;
  const db = await createClient();
  const { data: docs } = await db
    .from("application_documents")
    .select("public_id")
    .eq("application_id", id);
  const { error } = await db.from("scholarship_applications").delete().eq("id", id);
  if (error) throw new Error("Couldn't delete the application. Try again.");
  await destroyAssets((docs ?? []).map((d) => d.public_id));
  redirect("/admin/foundation");
}
