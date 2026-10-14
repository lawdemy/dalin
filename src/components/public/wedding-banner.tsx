import { Heart } from "lucide-react";
import Link from "next/link";
import { CloudImage } from "@/components/ui/cloud-image";
import type { Photo } from "@/lib/images";

type WeddingBannerProps = {
  coupleNames: string;
  /** A public photo of the two of us; falls back to a soft pattern. */
  photo: Photo | null;
};

/** "We're getting married — coming soon". No date until we announce it. */
export function WeddingBanner({ coupleNames, photo }: WeddingBannerProps) {
  return (
    <section
      aria-labelledby="wedding-banner"
      className="mx-auto w-full max-w-300 px-5 pt-10 md:px-6 md:pt-14"
    >
      <div className="relative isolate overflow-hidden rounded-xl bg-accent-deep text-ivory">
        {photo ? (
          <CloudImage
            sources={photo.sources}
            blurDataUrl={photo.blurDataUrl}
            alt=""
            fill
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="-z-20 object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,var(--color-accent)_0,transparent_45%),radial-gradient(circle_at_80%_70%,var(--color-accent-dark)_0,transparent_50%)]"
          />
        )}
        {/* Warm veil so the words stay readable on any photo. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-t from-night/85 via-night/45 to-night/15 md:bg-linear-to-r md:from-night/80 md:via-night/40 md:to-transparent"
        />

        <div className="flex min-h-90 flex-col justify-end gap-3 px-6 py-8 md:min-h-105 md:max-w-150 md:justify-center md:px-12 md:py-12">
          <span className="flex items-center gap-2 text-caption font-medium tracking-[3px] text-accent-light uppercase">
            <Heart aria-hidden className="size-4" strokeWidth={2} fill="currentColor" />
            Coming soon
          </span>
          <h2
            id="wedding-banner"
            className="font-serif text-title leading-none font-semibold md:text-title-lg"
          >
            We&rsquo;re getting married
          </h2>
          <p className="max-w-110 text-lead text-ivory/90">
            {coupleNames} are counting down to forever. The date and details will be shared here
            soon.
          </p>
          <div className="mt-2 flex items-center gap-3" aria-hidden>
            <span className="h-px w-12 bg-accent-light/70" />
            <span className="font-serif text-quote text-accent-light italic">save the day</span>
            <span className="h-px w-12 bg-accent-light/70" />
          </div>
          <Link
            href="/about"
            className="mt-3 inline-flex min-h-11 items-center self-start rounded-xl border border-ivory/70 px-5 font-semibold text-ivory no-underline hover:bg-ivory hover:text-ink"
          >
            Read our story
          </Link>
        </div>
      </div>
    </section>
  );
}
