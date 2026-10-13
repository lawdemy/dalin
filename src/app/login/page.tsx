import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// No sign-up and no password reset here: both accounts are created, and
// passwords reset, by hand in the Supabase dashboard (CLAUDE.md).
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6">
      <div className="flex flex-col items-center gap-3 pt-24 text-center">
        <h1 className="text-title">Welcome back</h1>
        <p className="text-muted">Sign in to write in our diary.</p>
      </div>
      <div className="mt-10">
        <LoginForm />
      </div>
      <Link
        href="/"
        className="mx-auto mt-auto mb-8 flex min-h-11 items-center gap-1 pt-10 text-label font-medium no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.8} />
        Back to the site
      </Link>
    </main>
  );
}
