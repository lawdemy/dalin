import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  displayName: string;
  avatarPath: string | null;
};

/**
 * The signed-in user, verified, plus their profile row. `member` is null when
 * signed in but not one of the two of us. Cached per request.
 */
const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_path")
    .eq("id", userId)
    .maybeSingle();

  const member: Member | null = profile
    ? { id: profile.id, displayName: profile.display_name, avatarPath: profile.avatar_path }
    : null;
  return { userId, member };
});

/**
 * Use at the top of every admin page, data helper and Server Action.
 * Redirects to /login when signed out, and signs out anyone who isn't a member.
 */
export async function requireMember(): Promise<Member> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.member) redirect("/login?error=not-allowed");
  return session.member;
}
