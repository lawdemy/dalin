// NEXT_PUBLIC_* values are inlined at build time, so they must be read with
// these exact property names (no dynamic process.env[name] lookups).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** The Supabase URL and anon key, or null until .env.local is filled in. */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase isn't configured. Copy .env.local.example to .env.local, fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.",
    );
  }
  return env;
}
