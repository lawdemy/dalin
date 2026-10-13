import type { Metadata } from "next";
import { PhotoLibrary } from "@/components/admin/photo-library";
import { getPhotoLibrary } from "@/lib/queries/photos";

export const metadata: Metadata = { title: "Photos" };

export default async function PhotosPage() {
  const { photos, momentsEnabled } = await getPhotoLibrary(); // checks membership
  return <PhotoLibrary photos={photos} momentsEnabled={momentsEnabled} />;
}
