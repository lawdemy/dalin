// Fallbacks until the names and welcome line come from site_settings (step 6).
export const SITE_NAME = "Our Diary";
export const SITE_TAGLINE = "Written together, one day at a time.";

export const PUBLIC_NAV = [
  { href: "/about", label: "About us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/moments", label: "Moments" },
] as const;
