import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export function SiteFooter({ name = SITE_NAME }: { name?: string }) {
  return (
    <footer className="mt-auto border-t border-sand">
      <div className="mx-auto flex max-w-300 flex-col items-center gap-1 px-5 pt-10 pb-8 text-center md:flex-row md:justify-between md:gap-6 md:px-6 md:py-8 md:text-left">
        <span className="font-serif text-card-sm font-semibold">{name}</span>
        <span className="text-caption text-muted">{SITE_TAGLINE}</span>
      </div>
    </footer>
  );
}
