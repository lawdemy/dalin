import { Heart, Image as ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MomentCard } from "@/components/public/moment-card";
import { PhotoGrid } from "@/components/public/photo-grid";
import { Eyebrow, SectionHeading } from "@/components/public/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { CloudImage } from "@/components/ui/cloud-image";
import { getGalleryPhotos, getHeroPhoto, getMoments, getSiteSettings } from "@/lib/queries/public";
import { shareMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { coupleNames, welcomeLine } = await getSiteSettings();
  return {
    title: { absolute: coupleNames },
    description: welcomeLine || undefined,
    ...shareMetadata({ title: coupleNames, description: welcomeLine || undefined }),
  };
}

export default async function HomePage() {
  const [settings, hero, latest, gallery] = await Promise.all([
    getSiteSettings(),
    getHeroPhoto(),
    getMoments(1, 3),
    getGalleryPhotos(0, 6),
  ]);
  const [featured, ...more] = latest.moments;

  return (
    <div className="flex flex-col pb-12 md:pb-24">
      {/* Hero: full-bleed on phones, rounded inside the container on desktop. */}
      <div className="md:mx-auto md:w-full md:max-w-300 md:px-6 md:pt-8">
        <div className="relative h-110 overflow-hidden bg-tone-1 md:h-140 md:rounded-xl">
          {hero ? (
            <CloudImage
              sources={hero.sources}
              blurDataUrl={hero.blurDataUrl}
              alt={hero.alt || settings.coupleNames}
              fill
              priority
              sizes="(min-width: 1200px) 1152px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Heart aria-hidden className="size-8 text-accent" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      <section className="mx-auto flex max-w-180 flex-col items-center gap-2 px-5 pt-8 text-center md:gap-3 md:px-6 md:pt-12">
        <Eyebrow>Our diary</Eyebrow>
        <h1 className="text-title md:text-title-lg">{settings.coupleNames}</h1>
        {settings.welcomeLine && (
          <p className="max-w-80 text-ink-soft md:max-w-none md:text-lead">
            {settings.welcomeLine}
          </p>
        )}
      </section>

      {featured && (
        <section
          aria-labelledby="latest-moments"
          className="mx-auto flex w-full max-w-300 flex-col gap-4 px-5 pt-12 md:gap-6 md:px-6 md:pt-20"
        >
          <SectionHeading id="latest-moments" link={{ href: "/moments", label: "See all" }}>
            Latest moments
          </SectionHeading>
          {/* Phones: one featured card, then rows. Desktop: three cards. */}
          <div className="flex flex-col gap-4 md:hidden">
            <MomentCard moment={featured} />
            {more.map((m, i) => (
              <MomentCard key={m.id} moment={m} layout="row" index={i + 1} />
            ))}
          </div>
          <div className="hidden gap-6 md:grid md:grid-cols-3">
            {latest.moments.map((m, i) => (
              <MomentCard key={m.id} moment={m} index={i} />
            ))}
          </div>
        </section>
      )}

      <section
        aria-labelledby="from-the-gallery"
        className="mx-auto flex w-full max-w-300 flex-col gap-4 px-5 pt-12 md:gap-6 md:px-6 md:pt-20"
      >
        <SectionHeading
          id="from-the-gallery"
          link={gallery.photos.length ? { href: "/gallery", label: "View all" } : undefined}
        >
          From the gallery
        </SectionHeading>
        {gallery.photos.length ? (
          <PhotoGrid photos={gallery.photos} layout="square" className="md:grid-cols-6" />
        ) : (
          <p className="flex items-center gap-2 text-muted">
            <ImageIcon aria-hidden className="size-5 text-accent" strokeWidth={1.5} />
            Photos are on their way.
          </p>
        )}
      </section>

      <section className="mx-auto w-full max-w-180 px-5 pt-12 md:px-6 md:pt-20">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-sand px-6 py-8 text-center md:px-8 md:py-12">
          <Heart aria-hidden className="size-6 text-accent" strokeWidth={1.6} />
          <h2 className="text-section md:text-section-lg">How we got here</h2>
          <p className="text-ink-soft">How we met, the proposal, and what comes next.</p>
          <Link href="/about" className={buttonClasses({ className: "mt-1 px-6" })}>
            Read our story
          </Link>
        </div>
      </section>
    </div>
  );
}
