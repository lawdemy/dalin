import type { Metadata } from "next";
import { AboutForm } from "@/components/admin/about-form";
import { getPhotoLibrary } from "@/lib/queries/photos";
import { getAboutSettings } from "@/lib/queries/settings";

export const metadata: Metadata = { title: "About Us editor" };

export default async function AboutEditorPage() {
  const [settings, { photos }] = await Promise.all([getAboutSettings(), getPhotoLibrary()]);
  return <AboutForm settings={settings} photos={photos} />;
}
