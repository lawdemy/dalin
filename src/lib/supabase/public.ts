import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for public pages. It never reads cookies, so it always
 * queries as the anonymous role, even when one of us is signed in and
 * browsing the public site. RLS alone decides what it can see.
 * Returns null until the keys are configured.
 */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type PublicClient = NonNullable<ReturnType<typeof createPublicClient>>;
