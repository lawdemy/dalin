import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Runs before every page request:
 * - refreshes the Supabase session cookie,
 * - sends signed-out visitors from /admin/** to /login,
 * - sends signed-in users from /login to /admin.
 *
 * This is the first gate only. Admin pages and every Server Action check the
 * user again with requireMember(), so nothing relies on the proxy alone.
 */
export async function proxy(request: NextRequest) {
  const { response, userId, supabase } = await updateSession(request);
  const { pathname, search, searchParams } = request.nextUrl;

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === "/login";

  if (isAdmin && !userId) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return redirectWithCookies(url, response());
  }

  if (isLogin && userId && supabase) {
    // Signed in but not one of the two members: end that session and show the form.
    if (searchParams.get("error") === "not-allowed") {
      await supabase.auth.signOut({ scope: "local" });
      return response();
    }
    return redirectWithCookies(new URL("/admin", request.url), response());
  }

  return response();
}

/** A redirect that keeps any session cookies the refresh just set. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: [
    // Everything except static files and images.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
