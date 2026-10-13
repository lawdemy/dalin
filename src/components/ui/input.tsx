import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full min-w-0 rounded-xl border border-line bg-linen text-body text-ink transition-colors disabled:cursor-not-allowed disabled:text-disabled aria-invalid:border-[1.5px] aria-invalid:border-danger";

/** Text, email, password, date, search … Use `type="date"` for the date picker. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-12 px-3.5", className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea rows={rows} className={cn(control, "resize-y px-3.5 py-3", className)} {...props} />
  );
}

/** Native select (best on phones), styled to match the inputs. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "h-12 appearance-none pr-10 pl-3.5", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
