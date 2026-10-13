"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Submits "on" when checked, like a checkbox. */
  name?: string;
  className?: string;
};

/** A labelled on/off row, e.g. "In public gallery". */
export function Switch({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  name,
  className,
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const on = checked ?? internal;
  const labelId = useId();

  function toggle() {
    if (checked === undefined) setInternal(!on);
    onCheckedChange?.(!on);
  }

  return (
    <div className={cn("flex min-h-12 items-center justify-between gap-4", className)}>
      <span id={labelId} className="font-medium">
        {label}
      </span>
      {name && on && <input type="hidden" name={name} value="on" />}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "flex h-8 w-13 shrink-0 rounded-full p-[3px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          on ? "justify-end bg-accent-dark" : "justify-start bg-line",
        )}
      >
        <span className="size-6.5 rounded-full bg-white shadow-segment" />
      </button>
    </div>
  );
}
