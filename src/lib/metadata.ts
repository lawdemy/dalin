import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

/**
 * Share-preview fields for a page. A page's `openGraph` replaces the root
 * layout's instead of merging with it, so every page that sets its own
 * title or description builds the whole block here, image included.
 */
export function shareMetadata({
  title,
  description,
  type = "website",
}: {
  title: string;
  description?: string;
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const images = [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }];
  return {
    openGraph: { type, siteName: SITE_NAME, locale: "en_GB", title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
