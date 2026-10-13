"use client";

import Image, { type ImageProps } from "next/image";

export type ImageSource = { width: number; url: string };

type CloudImageProps = Omit<ImageProps, "src" | "loader" | "placeholder" | "blurDataURL"> & {
  /** Signed URLs at several widths, from the server. */
  sources: ImageSource[];
  blurDataUrl?: string | null;
};

/**
 * next/image backed by pre-signed Cloudinary URLs. The browser can't sign
 * URLs, so the loader picks the nearest pre-signed width for each srcset
 * entry. Cloudinary does the resizing; Next's optimizer is not used.
 */
export function CloudImage({ sources, blurDataUrl, alt, ...props }: CloudImageProps) {
  const sorted = [...sources].sort((a, b) => a.width - b.width);
  const largest = sorted[sorted.length - 1];
  if (!largest) return null;

  return (
    <Image
      {...props}
      alt={alt}
      src={largest.url}
      loader={({ width }) => (sorted.find((s) => s.width >= width) ?? largest).url}
      placeholder={blurDataUrl ? "blur" : "empty"}
      blurDataURL={blurDataUrl ?? undefined}
    />
  );
}
