"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A form so sign-out works as a POST; shows a spinner while it runs. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <SubmitButton className={className} />
    </form>
  );
}

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      pending={pending}
      className={cn("text-danger-text hover:text-danger-text", className)}
    >
      {!pending && <LogOut aria-hidden className="size-4.5" strokeWidth={1.8} />}
      Sign out
    </Button>
  );
}
