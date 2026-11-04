import "server-only";
import { requireMember } from "@/lib/auth";
import type { VisionStatus } from "@/lib/constants";
import { PHOTO_COLUMNS, toPhotos, type Photo, type PhotoRow } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";

export type Vision = {
  id: string;
  title: string;
  area: string;
  /** Null means the vision belongs to the family. */
  ownerId: string | null;
  ownerName: string | null;
  description: string | null;
  targetDate: string | null;
  status: VisionStatus;
  achievedOn: string | null;
  photo: Photo | null;
  /** Family visions and my own; RLS enforces the same rule. */
  canEdit: boolean;
};

export type VisionPerson = { id: string; name: string };

type VisionRow = {
  id: string;
  title: string;
  area: string;
  owner_id: string | null;
  description: string | null;
  target_date: string | null;
  status: VisionStatus;
  achieved_on: string | null;
  photo: PhotoRow | PhotoRow[] | null;
};

const VISION_COLUMNS = `id, title, area, owner_id, description, target_date, status, achieved_on, photo:photos!visions_photo_id_fkey(${PHOTO_COLUMNS})`;

/** True for "relation doesn't exist" (migration 0013 not run yet). */
const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

async function loadPeople(db: Awaited<ReturnType<typeof createClient>>): Promise<VisionPerson[]> {
  const { data, error } = await db.from("profiles").select("id, display_name").order("created_at");
  if (error) throw new Error(`Couldn't load profiles: ${error.message}`);
  return (data ?? []).map((p) => ({ id: p.id, name: p.display_name }));
}

function toVision(row: VisionRow, meId: string, people: VisionPerson[]): Vision {
  const photo = Array.isArray(row.photo) ? row.photo[0] : row.photo;
  return {
    id: row.id,
    title: row.title,
    area: row.area,
    ownerId: row.owner_id,
    ownerName: people.find((p) => p.id === row.owner_id)?.name ?? null,
    description: row.description,
    targetDate: row.target_date,
    status: row.status,
    achievedOn: row.achieved_on,
    photo: photo ? toPhotos([photo])[0] : null,
    canEdit: row.owner_id === null || row.owner_id === meId,
  };
}

/** Every vision, newest first. `setupNeeded` until migration 0013 runs. */
export async function listVisions(): Promise<{
  visions: Vision[];
  people: VisionPerson[];
  setupNeeded?: boolean;
}> {
  const me = await requireMember();
  const db = await createClient();
  const [people, { data, error }] = await Promise.all([
    loadPeople(db),
    db.from("visions").select(VISION_COLUMNS).order("created_at", { ascending: false }),
  ]);
  if (error) {
    if (missingTable(error.code)) return { visions: [], people, setupNeeded: true };
    throw new Error(`Couldn't load visions: ${error.message}`);
  }
  return {
    people,
    visions: ((data ?? []) as VisionRow[]).map((v) => toVision(v, me.id, people)),
  };
}

export async function getVision(id: string): Promise<Vision | null> {
  const me = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createClient();
  const [people, { data, error }] = await Promise.all([
    loadPeople(db),
    db.from("visions").select(VISION_COLUMNS).eq("id", id).maybeSingle(),
  ]);
  if (error) {
    if (missingTable(error.code)) return null;
    throw new Error(`Couldn't load the vision: ${error.message}`);
  }
  return data ? toVision(data as VisionRow, me.id, people) : null;
}
