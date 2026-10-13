"use client";

import { Globe, Lock } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { Visibility } from "./visibility-badge";

const options = [
  { value: "private", label: "Private", Icon: Lock },
  { value: "public", label: "Public", Icon: Globe },
] as const;

const help: Record<Visibility, string> = {
  private: "Only the two of us can see this entry and its photos.",
  public: "Anyone with the link can read this on Moments, with its photos.",
};

type VisibilityToggleProps = {
  /** Form field name; the value is submitted through a hidden input. */
  name?: string;
  defaultValue?: Visibility;
  value?: Visibility;
  onChange?: (value: Visibility) => void;
  legend?: string;
  className?: string;
};

/** Private / Public segmented control. Defaults to private. */
export function VisibilityToggle({
  name = "visibility",
  defaultValue = "private",
  value,
  onChange,
  legend = "Who can see this?",
  className,
}: VisibilityToggleProps) {
  const [internal, setInternal] = useState<Visibility>(defaultValue);
  const current = value ?? internal;
  const helpId = useId();

  function select(next: Visibility) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }

  return (
    <fieldset className={cn("flex flex-col gap-2", className)} aria-describedby={helpId}>
      <legend className="mb-2 text-label font-medium">{legend}</legend>
      <input type="hidden" name={name} value={current} />
      <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-track p-1">
        {options.map(({ value: option, label, Icon }) => {
          const on = option === current;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => select(option)}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-[10px] text-[0.9375rem] font-semibold transition-colors",
                on ? "bg-ivory text-ink shadow-segment" : "text-muted hover:text-ink",
              )}
            >
              <Icon aria-hidden className="size-4.5" strokeWidth={1.8} />
              {label}
            </button>
          );
        })}
      </div>
      <p id={helpId} className="text-caption text-muted" aria-live="polite">
        {help[current]}
      </p>
    </fieldset>
  );
}
