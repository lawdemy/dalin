import "server-only";
import { requireMember } from "@/lib/auth";
import { signedSources, type ImageSource } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";
import type { TiptapDoc } from "@/components/rich-text/rich-text";

/** Everything the About editor edits. Members only. */
export type AboutSettings = {
  coupleNames: string;
  welcomeLine: string;
  ourStory: TiptapDoc | null;
  howWeMet: TiptapDoc | null;
  engagementDate: string | null;
  engagementPlace: string | null;
  engagementStory: TiptapDoc | null;
};

export async function getAboutSettings(): Promise<AboutSettings> {
  await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("site_settings")
    .select(
      "couple_names, welcome_line, our_story, how_we_met, engagement_date, engagement_place, engagement_story",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load site settings: ${error.message}`);
  return {
    coupleNames: data?.couple_names ?? "",
    welcomeLine: data?.welcome_line ?? "",
    ourStory: data?.our_story ?? null,
    howWeMet: data?.how_we_met ?? null,
    engagementDate: data?.engagement_date ?? null,
    engagementPlace: data?.engagement_place ?? null,
    engagementStory: data?.engagement_story ?? null,
  };
}

export type Profile = {
  id: string;
  displayName: string;
  avatar: ImageSource[] | null;
  isMe: boolean;
};

/** The Moments switch and both profiles (yours first). Members only. */
export async function getSettings(): Promise<{ momentsEnabled: boolean; profiles: Profile[] }> {
  const me = await requireMember();
  const db = await createClient();
  const [settings, profiles] = await Promise.all([
    db.from("site_settings").select("moments_enabled").eq("id", 1).maybeSingle(),
    db.from("profiles").select("id, display_name, avatar_path").order("created_at"),
  ]);
  if (settings.error) throw new Error(`Couldn't load settings: ${settings.error.message}`);
  if (profiles.error) throw new Error(`Couldn't load profiles: ${profiles.error.message}`);

  const list = (profiles.data ?? []).map((p) => ({
    id: p.id as string,
    displayName: p.display_name as string,
    avatar: p.avatar_path ? signedSources(p.avatar_path, 512) : null,
    isMe: p.id === me.id,
  }));
  return {
    momentsEnabled: settings.data?.moments_enabled === true,
    profiles: [...list.filter((p) => p.isMe), ...list.filter((p) => !p.isMe)],
  };
}

/** Whether the public Moments feed is switched on. Members only. */
export async function getMomentsEnabled(): Promise<boolean> {
  await requireMember();
  const db = await createClient();
  const { data, error } = await db
    .from("site_settings")
    .select("moments_enabled")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load settings: ${error.message}`);
  return data?.moments_enabled === true;
}
