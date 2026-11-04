import type { Metadata } from "next";
import { VisionForm } from "@/components/admin/vision-form";
import { listVisions } from "@/lib/queries/visions";

export const metadata: Metadata = { title: "Add a vision" };

export default async function NewVisionPage() {
  const { visions } = await listVisions(); // checks membership
  return <VisionForm usedAreas={visions.map((v) => v.area)} />;
}
