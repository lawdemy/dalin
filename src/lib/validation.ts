import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
  // Where to go after signing in; only admin paths are allowed.
  next: z
    .string()
    .optional()
    .transform((v) => (v && /^\/admin(?:[/?#]|$)/.test(v) && !v.startsWith("//") ? v : "/admin")),
});
