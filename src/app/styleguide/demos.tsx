"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Lightbox } from "@/components/ui/lightbox";
import { PhotoTile, placeholderTone } from "@/components/ui/photo-tile";
import { Switch } from "@/components/ui/switch";
import { ToastProvider, ToastView, useToast } from "@/components/ui/toast";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { cn } from "@/lib/utils";

const categories = ["Everyday", "Date night", "Travel", "Milestone", "Food", "Family", "Other"];

export function ChipDemo() {
  const [selected, setSelected] = useState("Family");
  return (
    <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <Chip key={c} selected={c === selected} onClick={() => setSelected(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

export function ToggleDemo() {
  return (
    <div className="flex flex-col gap-4">
      <VisibilityToggle />
      <div className="flex flex-col">
        <Switch label="In public gallery" defaultChecked />
        <Switch label="On About page" />
        <Switch label="Disabled" disabled />
      </div>
    </div>
  );
}

export function FeedbackDemo() {
  return (
    <ToastProvider>
      <ToastView message="Entry saved" action={{ label: "Undo", onClick: () => {} }} />
      <FeedbackButtons />
    </ToastProvider>
  );
}

function FeedbackButtons() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() =>
          toast({ message: "Entry saved", action: { label: "Undo", onClick: () => {} } })
        }
      >
        Show toast
      </Button>
      <ConfirmDialog
        title="Delete this entry?"
        description={<>“Sunday lunch at Mama’s” and its 7 photos will be deleted for good.</>}
        onConfirm={() => new Promise((resolve) => setTimeout(resolve, 800))}
        trigger={(open) => (
          <Button variant="ghost" className="text-danger-text" onClick={open}>
            <Trash2 aria-hidden className="size-4.5" strokeWidth={1.8} />
            Delete entry
          </Button>
        )}
      />
    </div>
  );
}

const photos = Array.from({ length: 6 }, (_, i) => ({
  key: `photo-${i}`,
  caption: i === 0 ? "Mama’s jollof" : i === 2 ? "The veranda crew" : undefined,
  content: (
    <div
      className={cn(
        "flex h-full items-center justify-center text-caption text-tone-ink",
        placeholderTone(i),
      )}
    >
      Photo {i + 1}
    </div>
  ),
}));

export function LightboxDemo() {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <button
            key={p.key}
            type="button"
            aria-label={`Open photo ${i + 1}`}
            onClick={() => setIndex(i)}
            className="cursor-zoom-in rounded-xl"
          >
            <PhotoTile tone={i} />
          </button>
        ))}
      </div>
      <Lightbox items={photos} index={index} onIndexChange={setIndex} />
    </>
  );
}
