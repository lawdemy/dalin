import imageCompression from "browser-image-compression";
import exifr from "exifr";
import { getUploadTicket, registerPhoto } from "@/app/admin/entries/actions";
import { getAvatarUploadTicket, setAvatar } from "@/app/admin/settings/actions";
import type { Photo } from "@/lib/images";

/*
 * Browser side of a photo upload:
 * 1. read when it was taken (before the metadata is gone),
 * 2. re-encode to WebP (JPEG fallback) at 2560px max, which drops all EXIF
 *    including GPS,
 * 3. make a tiny blurred placeholder,
 * 4. upload straight to Cloudinary with a one-time signed ticket,
 * 5. ask the server to record it (it checks the file with Cloudinary).
 */

const MAX_EDGE = 2560;
const QUALITY = 0.82;
// Self-hosted copy of the compression worker (no third-party CDN).
const WORKER_URL = "/vendor/browser-image-compression-2.0.2.js";

export class UploadError extends Error {}

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

async function reencode(file: File, maxEdge = MAX_EDGE): Promise<File> {
  const options = {
    maxWidthOrHeight: maxEdge,
    initialQuality: QUALITY,
    maxSizeMB: 1.5,
    useWebWorker: true,
    libURL: WORKER_URL,
    preserveExif: false,
  };
  let out: File;
  try {
    out = await imageCompression(file, { ...options, fileType: "image/webp" });
    // Older Safari can't encode WebP and silently returns PNG; use JPEG then.
    if (out.type !== "image/webp")
      out = await imageCompression(file, { ...options, fileType: "image/jpeg" });
  } catch {
    throw new UploadError(
      /\.(heic|heif)$/i.test(file.name)
        ? `${file.name} is a HEIC photo this browser can't read. Pick it from the Photos app on your iPhone, or convert it to JPEG first.`
        : `${file.name} couldn't be read as a photo.`,
    );
  }
  // Never upload the original (it may carry GPS data).
  if (out === file || !["image/webp", "image/jpeg"].includes(out.type)) {
    throw new UploadError(`${file.name} couldn't be prepared for upload.`);
  }
  return out;
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

function postWithProgress(url: string, body: FormData, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new UploadError("The upload was refused. Try again."));
    xhr.onerror = () =>
      reject(new UploadError("The upload failed. Check your connection and try again."));
    xhr.send(body);
  });
}
