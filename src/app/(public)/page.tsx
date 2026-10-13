import { SITE_TAGLINE } from "@/lib/constants";

// Placeholder until the public home page is built in step 6.
export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-24 text-center">
      <span className="text-caption font-medium tracking-[2px] text-muted uppercase">
        Our diary
      </span>
      <h1 className="text-title md:text-title-lg">Coming soon</h1>
      <p className="max-w-80 text-ink-soft">{SITE_TAGLINE}</p>
    </section>
  );
}
