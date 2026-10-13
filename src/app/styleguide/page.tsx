import { BookOpen, Calendar, Heart, House, Image as ImageIcon, MapPin } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EntryCard } from "@/components/ui/card";
import { Tag } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { describedBy, Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PhotoTile, placeholderTone } from "@/components/ui/photo-tile";
import { VisibilityBadge } from "@/components/ui/visibility-badge";
import { cn } from "@/lib/utils";
import { ChipDemo, FeedbackDemo, LightboxDemo, ToggleDemo } from "./demos";

export const metadata: Metadata = { title: "Style guide" };

const colours = [
  ["ivory", "bg-ivory", "#FBF8F3", "page"],
  ["linen", "bg-linen", "#F3ECE2", "cards, inputs"],
  ["sand", "bg-sand", "#E4D7C5", "borders"],
  ["ink", "bg-ink", "#2E2A27", "text"],
  ["muted", "bg-muted", "#6E635A", "secondary text"],
  ["accent", "bg-accent", "#B9776B", "icons, focus"],
  ["accent-dark", "bg-accent-dark", "#9C5F54", "buttons, links"],
  ["accent-deep", "bg-accent-deep", "#844E45", "hover, pressed"],
] as const;

export default function StyleGuidePage() {
  return (
    <main className="mx-auto flex max-w-300 flex-col gap-14 px-5 py-10 md:px-16 md:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-title md:text-title-lg">Our Diary · style guide</h1>
        <p className="text-caption text-muted">
          8 px spacing · 12 px radius · Lucide icons 20 px. Tokens live in{" "}
          <code>src/app/globals.css</code>.
        </p>
      </header>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {colours.map(([name, bg, hex, use]) => (
            <div key={name} className="flex flex-col gap-2">
              <div
                className={cn("h-24 rounded-xl", bg, name === "ivory" && "border border-sand")}
              />
              <span className="text-label font-semibold">{name}</span>
              <span className="text-caption text-muted">
                {hex} · {use}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-14 lg:grid-cols-2">
        <Section title="Type">
          <TypeRow spec="Page title · 40 / 56">
            <span className="font-serif text-title font-semibold md:text-title-lg">Our story</span>
          </TypeRow>
          <TypeRow spec="Section · 28 / 36">
            <span className="font-serif text-section font-semibold md:text-section-lg">
              Latest moments
            </span>
          </TypeRow>
          <TypeRow spec="Card title · 26">
            <span className="font-serif text-card font-semibold">Sunday lunch at Mama’s</span>
          </TypeRow>
          <TypeRow spec="Quote · 24 italic">
            <span className="font-serif text-quote font-medium italic">
              “You two should come every Sunday.”
            </span>
          </TypeRow>
          <TypeRow spec="Body · Inter 16 / 1.6">
            Mama made her famous jollof and refused all help in the kitchen, as usual.
          </TypeRow>
          <TypeRow spec="Caption · 13">
            <span className="text-caption text-muted">Sun 11 Oct 2026 · Family</span>
          </TypeRow>
          <TypeRow spec="Eyebrow · 13 caps">
            <span className="text-caption font-medium tracking-[2px] text-muted uppercase">
              Our diary
            </span>
          </TypeRow>
        </Section>

        <Section title="Buttons">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button>Save</Button>
            <Button variant="secondary">Upload</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Delete</Button>
            <Button disabled>Save</Button>
            <Button variant="secondary" disabled>
              Upload
            </Button>
            <Button variant="ghost" disabled>
              Cancel
            </Button>
            <Button pending>Saving</Button>
          </div>
          <Button size="lg" fullWidth>
            Save and share publicly
          </Button>
          <p className="text-caption text-muted">
            Hover darkens to accent-deep. Tab to see the focus ring.
          </p>
        </Section>
      </div>

      <div className="grid gap-14 lg:grid-cols-3">
        <Section title="Inputs">
          <Field id="sg-title" label="Title" required>
            <Input id="sg-title" placeholder="Give the day a name" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="sg-date" label="Date">
              <Input id="sg-date" type="date" defaultValue="2026-10-13" />
            </Field>
            <Field id="sg-cat" label="Category">
              <Select id="sg-cat" defaultValue="everyday">
                <option value="everyday">Everyday</option>
                <option value="date_night">Date night</option>
                <option value="travel">Travel</option>
              </Select>
            </Field>
          </div>
          <Field id="sg-notes" label="Notes">
            <Textarea id="sg-notes" rows={3} placeholder="Write about your day…" />
          </Field>
          <Field id="sg-loc" label="Location" hint="Optional, e.g. Surulere, Lagos">
            <Input
              id="sg-loc"
              placeholder="Where were you?"
              aria-describedby={describedBy("sg-loc", { hint: true })}
            />
          </Field>
          <Field id="sg-email" label="Email" error="Enter a valid email address.">
            <Input
              id="sg-email"
              type="email"
              defaultValue="not-an-email"
              aria-invalid
              aria-describedby={describedBy("sg-email", { error: true })}
            />
          </Field>
        </Section>

        <Section title="Chips & visibility">
          <ChipDemo />
          <div className="flex flex-wrap items-center gap-2">
            <Tag>Family</Tag>
            <VisibilityBadge visibility="private" />
            <VisibilityBadge visibility="public" />
            <VisibilityBadge visibility="private" compact />
            <VisibilityBadge visibility="public" compact />
          </div>
          <ToggleDemo />
        </Section>

        <Section title="Cards">
          <EntryCard
            media={<div className={cn("h-full", placeholderTone(1))} />}
            meta="Sun 11 Oct 2026 · Family"
            title="Sunday lunch at Mama’s"
          />
          <EntryCard
            layout="row"
            media={<div className={cn("h-full", placeholderTone(3))} />}
            meta="Sat 3 Oct 2026 · Date night"
            title="Our first pottery class"
            aside={<VisibilityBadge visibility="public" compact />}
          />
          <div className="grid grid-cols-3 gap-2">
            <PhotoTile tone={0} />
            <PhotoTile tone={3} progress={64} />
            <PhotoTile tone={2} selected />
          </div>
          <EmptyState title="No entries yet" description="Your first page is waiting." />
        </Section>
      </div>

      <div className="grid gap-14 lg:grid-cols-3">
        <Section title="Feedback">
          <FeedbackDemo />
        </Section>

        <Section title="Lightbox">
          <LightboxDemo />
          <p className="text-caption text-muted">
            Tap a tile. Swipe on phones, arrow keys on desktop, Esc closes.
          </p>
        </Section>

        <Section title="Avatars & icons">
          <div className="flex items-center gap-3">
            <Avatar name="Dan" size="md" />
            <Avatar name="Lin" size="md" tone="b" />
            <Avatar name="Dan" />
            <span className="flex items-center gap-1.5 text-caption text-muted">
              <Avatar name="Lin" size="xs" tone="b" /> Mon 12 · Food
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[House, BookOpen, ImageIcon, Calendar, MapPin].map((Icon, i) => (
              <span
                key={i}
                className="flex size-11 items-center justify-center rounded-xl bg-linen text-ink"
              >
                <Icon aria-hidden className="size-5" strokeWidth={1.8} />
              </span>
            ))}
            <span className="flex size-11 items-center justify-center rounded-xl bg-linen text-accent">
              <Heart aria-hidden className="size-5" strokeWidth={1.8} />
            </span>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section md:text-section-lg">{title}</h2>
      {children}
    </section>
  );
}

function TypeRow({ spec, children }: { spec: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-36 shrink-0 text-caption text-muted">{spec}</span>
      <span>{children}</span>
    </div>
  );
}
