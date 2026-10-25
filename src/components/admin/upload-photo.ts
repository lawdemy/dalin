import exifr from "exifr";
import { getUploadTicket, registerPhoto } from "@/app/admin/entries/actions";
import { getAvatarUploadTicket, setAvatar } from "@/app/admin/settings/actions";
import type { Photo } from "@/lib/images";
import { postWithProgress, reencode, UploadError } from "@/lib/upload-prep";

export { UploadError };

/*
 * Browser side of a photo upload:
 * 1. read when it was taken (before the metadata is gone),
 * 2. re-encode to WebP (JPEG fallback) at 2560px max, which drops all EXIF
 *    including GPS,
 * 3. make a tiny blurred placeholder,
 * 4. upload straight to Cloudinary with a one-time signed ticket,
 * 5. ask the server to record it (it checks the file with Cloudinary).
 */

export async function uploadPhoto(
  file: File,
  onProgress: (percent: number) => void,
): Promise<Photo> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
    throw new UploadError(`${file.name} isn't a photo.`);
  }
  if (file.size > 40 * 1024 * 1024)
    throw new UploadError(`${file.name} is too large (over 40 MB).`);

  const takenAt = await readTakenAt(file);
  const encoded = await reencode(file);
  onProgress(5);
  const blurDataUrl = await tinyPreview(encoded);

  const ticket = await getUploadTicket();
  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
  form.append("file", encoded, encoded.type === "image/webp" ? "photo.webp" : "photo.jpg");
  await postWithProgress(ticket.url, form, (p) => onProgress(5 + Math.round(p * 0.9)));

  const result = await registerPhoto({ publicId: ticket.publicId, takenAt, blurDataUrl });
  if (!result.photo) throw new UploadError(result.error ?? "That photo couldn't be saved.");
  onProgress(100);
  return result.photo;
}

async function readTakenAt(file: File): Promise<string | null> {
  try {
    const tags = await exifr.parse(file, { pick: ["DateTimeOriginal", "CreateDate"] });
    const date: unknown = tags?.DateTimeOriginal ?? tags?.CreateDate;
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  } catch {
    return null;
  }
}

/** Profile photo: same EXIF-free re-encode, smaller, no photos row. */
export async function uploadAvatar(file: File, onProgress: (percent: number) => void) {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
    throw new UploadError(`${file.name} isn't a photo.`);
  }
  const encoded = await reencode(file, 1024);
  onProgress(10);
  const ticket = await getAvatarUploadTicket();
  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
  form.append("file", encoded, encoded.type === "image/webp" ? "avatar.webp" : "avatar.jpg");
  await postWithProgress(ticket.url, form, (p) => onProgress(10 + Math.round(p * 85)));
  const result = await setAvatar(ticket.publicId);
  if (result.error) throw new UploadError(result.error);
  onProgress(100);
}

async function tinyPreview(blob: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = 16 / Math.max(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const url = canvas.toDataURL("image/webp", 0.6);
    return url.startsWith("data:image/webp") ? url : canvas.toDataURL("image/jpeg", 0.6);
  } catch {
    return null;
  }
}
