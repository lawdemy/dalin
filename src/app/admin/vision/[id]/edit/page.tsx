import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VisionForm } from "@/components/admin/vision-form";
import { getVision, listVisions } from "@/lib/queries/visions";

export const metadata: Metadata = { title: "Edit vision" };

export default async function EditVisionPage({ params }: PageProps<"/admin/vision/[id]/edit">) {
  const { id } = await params;
  const vision = await getVision(id); // checks membership
  if (!vision) notFound();
  if (!vision.canEdit) redirect(`/admin/vision/${vision.id}`);
  const { visions } = await listVisions();
  return <VisionForm vision={vision} usedAreas={visions.map((v) => v.area)} />;
}
