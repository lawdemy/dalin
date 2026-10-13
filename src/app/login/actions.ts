"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation";

export type SignInState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

const WRONG_DETAILS = "Email or password is incorrect.";

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  const email = String(formData.get("email") ?? "");

  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return {
      email,
      fieldErrors: { email: fields.email?.[0], password: fields.password?.[0] },
    };
  }

  if (!getSupabaseEnv()) {
    return { email, error: "Sign-in isn't set up yet: the Supabase keys are missing." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    if (error?.status === 429) {
      return { email, error: "Too many attempts. Wait a minute and try again." };
    }
    if (error && error.status !== 400) {
      return { email, error: "Couldn't sign in. Check your connection and try again." };
    }
    return { email, error: WRONG_DETAILS };
  }

  // Only the two people in profiles may use the diary.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) {
    await supabase.auth.signOut({ scope: "local" });
    return { email, error: WRONG_DETAILS };
  }

  redirect(parsed.data.next);
}

export async function signOut() {
  if (getSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  // Drop cached admin pages in the browser so Back can't show them again.
  revalidatePath("/", "layout");
  redirect("/login");
}
