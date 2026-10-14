import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/queries/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { momentsEnabled, profiles } = await getSettings(); // checks membership
  return <SettingsForm momentsEnabled={momentsEnabled} profiles={profiles} />;
}
