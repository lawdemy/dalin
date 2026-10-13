"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useActionState, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, type SignInState } from "./actions";

const NOTICES: Record<string, string> = {
  "not-allowed": "This account can't open the diary.",
};

const noSubscribe = () => () => {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, {} as SignInState);
  const [showPassword, setShowPassword] = useState(false);
  // Read ?error= on the client so the page itself stays static.
  const errorCode = useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get("error"),
    () => null,
  );

  const message = state.error ?? (errorCode ? NOTICES[errorCode] : undefined);
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <form
      action={(formData) => {
        formData.set("next", new URLSearchParams(window.location.search).get("next") ?? "");
        formAction(formData);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      {message && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-rose-tint px-4 py-3 text-label text-danger-text"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4.5 shrink-0" strokeWidth={1.8} />
          <span>{message}</span>
        </div>
      )}

      <Field id="email" label="Email" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
          defaultValue={state.email}
          key={state.email}
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={describedBy("email", { error: emailError })}
        />
      </Field>

      <Field id="password" label="Password" error={passwordError}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-13"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={describedBy("password", { error: passwordError })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center rounded-[10px] text-muted hover:text-ink"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-5" strokeWidth={1.8} />
            ) : (
              <Eye aria-hidden className="size-5" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </Field>

      <Button type="submit" size="lg" fullWidth pending={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
