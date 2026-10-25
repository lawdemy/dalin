import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/constants";

/** Lets us add the diary to a phone's Home Screen; iPhones need this for push. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "DaLin",
    description: "Our life together, one day at a time.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#FBF8F3",
    theme_color: "#FBF8F3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
