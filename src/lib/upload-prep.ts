import imageCompression from "browser-image-compression";

/*
 * Browser-side helpers shared by every upload (diary photos, profile photos,
 * foundation documents): re-encode images so no EXIF or GPS data ever leaves
 * the device, and post straight to Cloudinary with progress.
 */

const MAX_EDGE = 2560;
const QUALITY = 0.82;
// Self-hosted copy of the compression worker (no third-party CDN).
const WORKER_URL = "/vendor/browser-image-compression-2.0.2.js";

export class UploadError extends Error {}

export async function reencode(file: File, maxEdge = MAX_EDGE): Promise<File> {
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

export function postWithProgress(
  url: string,
  body: FormData,
  onProgress: (fraction: number) => void,
) {
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
