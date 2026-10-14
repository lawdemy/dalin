import { BookOpen, Heart, HandHeart, Sparkles, Sunrise, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORD_KINDS, type DailyWord, type WordKind } from "@/lib/daily-words";

const KINDS: Record<WordKind, { label: string; icon: LucideIcon }> = {
  Scripture: { label: "Scripture for today", icon: BookOpen },
  Love: { label: "Love for today", icon: Heart },
  Romance: { label: "Romance for today", icon: Sparkles },
  Faith: { label: "Faith for today", icon: HandHeart },
  Motivation: { label: "Encouragement for today", icon: Sunrise },
};

/** Today's five words (one of each kind): Scripture full width, the rest in a grid. */
export function DailyWords({ words }: { words: Record<WordKind, DailyWord> }) {
  const [first, ...rest] = WORD_KINDS;
  return (
    <div className="flex flex-col gap-3">
      <DailyWordCard word={words[first]} />
      <div className="grid gap-3 md:grid-cols-2">
        {rest.map((kind) => (
          <DailyWordCard key={kind} word={words[kind]} compact />
        ))}
      </div>
    </div>
  );
}

/** One word of the day: new every morning, different for each of us. */
export function DailyWordCard({ word, compact = false }: { word: DailyWord; compact?: boolean }) {
  const { label, icon: Icon } = KINDS[word.kind];
  return (
    <figure
      className={cn(
        "flex flex-col rounded-xl border border-sand bg-ivory",
        compact ? "gap-2 px-4 py-4" : "gap-3 px-5 py-5 md:px-6",
      )}
    >
      <figcaption className="flex items-center gap-2 text-caption font-medium tracking-[1px] text-muted uppercase">
        <Icon aria-hidden className="size-4 text-accent" strokeWidth={1.8} />
        {label}
      </figcaption>
      <blockquote
        className={cn(
          "font-serif leading-snug font-medium italic",
          compact ? "text-card-sm" : "text-quote md:text-card",
        )}
      >
        &ldquo;{word.text}&rdquo;
      </blockquote>
      {word.source && <p className="text-label font-medium text-accent-dark">{word.source}</p>}
    </figure>
  );
}
