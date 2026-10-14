import { BookOpen, Heart, HandHeart, Sparkles, Sunrise, type LucideIcon } from "lucide-react";
import type { DailyWord, WordKind } from "@/lib/daily-words";

const KINDS: Record<WordKind, { label: string; icon: LucideIcon }> = {
  Scripture: { label: "Scripture for today", icon: BookOpen },
  Love: { label: "Love for today", icon: Heart },
  Romance: { label: "Romance for today", icon: Sparkles },
  Faith: { label: "Faith for today", icon: HandHeart },
  Motivation: { label: "Encouragement for today", icon: Sunrise },
};

/** The dashboard's word of the day: new every morning, the same for both of us. */
export function DailyWordCard({ word }: { word: DailyWord }) {
  const { label, icon: Icon } = KINDS[word.kind];
  return (
    <figure className="flex flex-col gap-3 rounded-xl border border-sand bg-ivory px-5 py-5 md:px-6">
      <figcaption className="flex items-center gap-2 text-caption font-medium tracking-[1px] text-muted uppercase">
        <Icon aria-hidden className="size-4 text-accent" strokeWidth={1.8} />
        {label}
      </figcaption>
      <blockquote className="font-serif text-quote leading-snug font-medium italic md:text-card">
        &ldquo;{word.text}&rdquo;
      </blockquote>
      {word.source && <p className="text-label font-medium text-accent-dark">{word.source}</p>}
    </figure>
  );
}
