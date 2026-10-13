import { CalendarHeart, MapPin } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PhotoGrid } from "@/components/public/photo-grid";
import { Eyebrow } from "@/components/public/section-heading";
import { isEmptyDoc, RichText } from "@/components/rich-text/rich-text";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLongDate } from "@/lib/format";
import { getAboutPhotos, getSiteSettings } from "@/lib/queries/public";
import { shareMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { coupleNames } = await getSiteSettings();
  const description = `How ${coupleNames} met, the proposal, and what comes next.`;
  return {
    title: "Our story",
    description,
    ...shareMetadata({ title: `Our story · ${coupleNames}`, description }),
  };
}

export default async function AboutPage() {
  const [settings, photos] = await Promise.all([getSiteSettings(), getAboutPhotos()]);
  const hasEngagement = Boolean(settings.engagementDate || settings.engagementPlace);
  const sections = [
    { title: "How we met", doc: settings.howWeMet },
    { title: "The proposal", doc: settings.engagementStory },
  ].filter((s) => !isEmptyDoc(s.doc));
  const hasStory = !isEmptyDoc(settings.ourStory) || sections.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col px-5 pb-16 md:px-6 md:pb-24">
      <header className="flex flex-col items-center gap-2 pt-12 pb-8 text-center">
        <Eyebrow>About us</Eyebrow>
        <h1 className="text-title md:text-title-lg">Our story</h1>
      </header>

      {hasEngagement && (
        <section
          aria-label="Engagement details"
          className="grid grid-cols-2 gap-4 rounded-xl bg-linen p-5 md:p-6"
        >
          {settings.engagementDate && (
            <Detail
              icon={<CalendarHeart aria-hidden className="size-4" strokeWidth={1.8} />}
              label="Engaged"
            >
              {formatLongDate(settings.engagementDate)}
            </Detail>
          )}
          {settings.engagementPlace && (
            <Detail
              icon={<MapPin aria-hidden className="size-4" strokeWidth={1.8} />}
              label="Where"
            >
              {settings.engagementPlace}
            </Detail>
          )}
        </section>
      )}

      {hasStory ? (
        <article className="flex flex-col gap-10 pt-10">
          <RichText doc={settings.ourStory} />
          {sections.map((s) => (
            <section key={s.title} className="flex flex-col gap-4">
              <h2 className="text-section md:text-section-lg">{s.title}</h2>
              <RichText doc={s.doc} />
            </section>
          ))}
        </article>
      ) : (
        <EmptyState
          className="mt-10"
          title="Our story is coming soon"
          description="We're still writing this part."
        />
      )}

      {photos.length > 0 && (
        <section aria-labelledby="about-photos" className="flex flex-col gap-4 pt-12">
          <h2 id="about-photos" className="text-section md:text-section-lg">
            Us
          </h2>
          <PhotoGrid photos={photos} layout="square" />
        </section>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-caption text-muted">
        {icon}
        {label}
      </span>
      <span className="font-serif text-card-sm font-semibold">{children}</span>
    </div>
  );
}
