"use client";

import { Chip } from "@/components/ui/chip";
import { CATEGORIES, type Category } from "@/lib/constants";

type CategoryPickerProps = { value: Category; onChange: (category: Category) => void };

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-label font-medium">Category</legend>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            size="lg"
            selected={c.value === value}
            onClick={() => onChange(c.value)}
          >
            {c.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
