import "server-only";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

/*
 * Cloudinary holds the photo files as private ("authenticated") assets.
 * Nothing can be fetched without a URL signed here, and callers sign only
 * rows they were allowed to read under RLS. Signed URLs don't expire, so a
 * photo that stops being public is renamed (renameAsset), which kills old
 * links within seconds. Keys are server-only.
 */

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const PHOTO_FOLDER = "dalin/photos";
const PUBLIC_ID_PATTERN = /^dalin\/photos\/\d{4}\/\d{2}\/[0-9a-f-]{36}$/;
const ALLOWED_FORMATS = ["webp", "jpg"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Widths offered to next/image; each gets its own signed URL. */
const WIDTHS = [256, 640, 828, 1200, 1920, 2560];

function client() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary isn't configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and " +
        "CLOUDINARY_API_SECRET to .env.local.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

export function isValidPublicId(publicId: string) {
  return PUBLIC_ID_PATTERN.test(publicId);
}

/** A fresh, unguessable public_id, e.g. dalin/photos/2026/10/<uuid>. */
export function newPhotoPublicId(now = new Date()) {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${PHOTO_FOLDER}/${yyyy}/${mm}/${randomUUID()}`;
}

/** The uuid at the end of a public_id; it doubles as the photos row id. */
export function photoIdFromPublicId(publicId: string) {
  return publicId.split("/").pop()!;
}

export type ImageSource = { width: number; url: string };

/** Signed, resized, auto-format URLs for the widths an image can fill. */
export function signedSources(publicId: string, originalWidth: number): ImageSource[] {
  const cld = client();
  const widths = WIDTHS.filter((w) => w < originalWidth);
  widths.push(Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]));
  return [...new Set(widths)].map((width) => ({
    width,
    url: cld.url(publicId, {
      type: "authenticated",
      sign_url: true,
      transformation: [
        { width, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
    }),
  }));
}

export type UploadTicket = {
  url: string;
  publicId: string;
  fields: Record<string, string>;
};

/**
 * A one-time signed upload for a server-chosen public_id. The browser posts
 * the file straight to Cloudinary with these fields.
 */
export function createUploadTicket(): UploadTicket {
  const cld = client();
  const publicId = newPhotoPublicId();
  const params = {
    public_id: publicId,
    type: "authenticated",
    overwrite: "false",
    allowed_formats: ALLOWED_FORMATS.join(","),
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const signature = cld.utils.api_sign_request(params, apiSecret!);
  return {
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    publicId,
    fields: { ...params, signature, api_key: apiKey! },
  };
}

/**
 * Confirms an upload landed as a private image within limits, and returns
 * its real size (never trust the browser's numbers). Null if not acceptable.
 */
export async function verifyUpload(publicId: string) {
  if (!isValidPublicId(publicId)) return null;
  try {
    const r = await client().api.resource(publicId, { type: "authenticated" });
    const ok =
      r.type === "authenticated" &&
      ALLOWED_FORMATS.includes(r.format === "jpeg" ? "jpg" : r.format) &&
      r.bytes <= MAX_UPLOAD_BYTES &&
      r.width > 0 &&
      r.height > 0;
    return ok ? { width: r.width as number, height: r.height as number } : null;
  } catch {
    return null;
  }
}

/** Gives an asset a new public_id and clears cached copies of the old one. */
export async function renameAsset(fromPublicId: string) {
  const to = newPhotoPublicId();
  await client().uploader.rename(fromPublicId, to, {
    type: "authenticated",
    invalidate: true,
    overwrite: false,
  });
  return to;
}

/** Deletes assets and clears cached copies. Failures are logged, not thrown. */
export async function destroyAssets(publicIds: string[]) {
  const cld = client();
  await Promise.all(
    publicIds.map((id) =>
      cld.uploader
        .destroy(id, { type: "authenticated", invalidate: true })
        .catch((e) => console.error(`Cloudinary destroy failed for ${id}`, e)),
    ),
  );
}
