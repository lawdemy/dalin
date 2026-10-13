import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-body font-semibold no-underline transition-colors select-none disabled:cursor-not-allowed aria-disabled:cursor-not-allowed";

const variants = {
  primary:
    "bg-accent-dark text-white hover:bg-accent-deep hover:text-white disabled:bg-sand disabled:text-disabled",
  secondary:
    "border border-accent-dark text-accent-dark hover:border-accent-deep hover:bg-rose-tint hover:text-accent-deep disabled:border-sand disabled:bg-transparent disabled:text-disabled",
  ghost:
    "font-medium text-ink hover:bg-linen hover:text-ink disabled:bg-transparent disabled:text-disabled",
  danger:
    "bg-danger text-white hover:bg-danger-text hover:text-white disabled:bg-sand disabled:text-disabled",
} as const;

const sizes = {
  md: "h-12 px-5",
  lg: "h-13 px-6",
  sm: "h-11 px-4 text-[0.9375rem]",
  icon: "size-11 p-0",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

type VariantProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

/** Class string for anything that should look like a button, e.g. a <Link>. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: VariantProps & { className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

type ButtonProps = ComponentProps<"button"> &
  VariantProps & {
    /** Shows a spinner and disables the button, e.g. while a form submits. */
    pending?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  pending = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {pending && <LoaderCircle aria-hidden className="size-5 animate-spin" />}
      {children}
    </button>
  );
}
