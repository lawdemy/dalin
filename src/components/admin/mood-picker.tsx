"use client";

import { MOODS, type Mood } from "@/lib/constants";
import { cn } from "@/lib/utils";

type MoodPickerProps = { value: Mood | null; onChange: (mood: Mood | null) => void };

/** 4×2 emoji tiles. Mood is optional: tap the selected one again to clear it. */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-label font-medium">
        Mood <span className="font-normal text-muted">(optional)</span>
      </legend>
      <div className="grid grid-cols-4 gap-2">
        {MOODS.map((m) => {
          const on = m.value === value;
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : m.value)}
              className={cn(
                "flex h-16 flex-col items-center justify-center rounded-xl text-micro text-ink transition-colors",
                on
                  ? "border-[1.5px] border-accent bg-rose-tint"
                  : "border border-transparent bg-linen hover:bg-sand/60",
              )}
            >
              <span aria-hidden className="text-[1.375rem] leading-tight">
                {m.emoji}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
