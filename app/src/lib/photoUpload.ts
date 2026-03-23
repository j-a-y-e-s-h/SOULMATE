import { supabase } from './supabase';

const BUCKET_NAME = 'profile-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|heic|heif)$/i;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heif', 'image/heic'];
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FaceDetectionResult {
  hasFace: boolean;
  confidence: number;
}

/**
 * Validates a file for type and size constraints.
 */
export function validateFile(file: File): ValidationResult {
  const typeOk = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.test(file.name);
  if (!typeOk) {
    return { valid: false, error: 'Only JPG, PNG, HEIF, and HEIC files are allowed.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File must be under 5 MB. This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
    };
  }
  return { valid: true };
}

/**
 * Converts HEIC/HEIF to a browser-compatible blob using heic2any (dynamic import).
 * Returns the original file if already JPG/PNG.
 */
async function convertHeicIfNeeded(file: File): Promise<Blob> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) return file;

  try {
    // Dynamic import so the library is only loaded when an HEIC file is encountered
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch {
    throw new Error('Could not convert HEIC/HEIF image. Please try a JPG or PNG file instead.');
  }
}

/**
 * Loads a blob into an HTMLImageElement. Revokes the object URL after load.
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });
}

/**
 * Loads a blob into an HTMLImageElement and returns the object URL too
 * (caller is responsible for revoking the URL).
 */
export function loadImageWithUrl(blob: Blob): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });
}

/**
 * Prepares a file for the crop modal — converts HEIC if needed and returns an object URL.
 * Caller must revoke the URL when done.
 */
export async function prepareForCrop(file: File): Promise<string> {
  const blob = await convertHeicIfNeeded(file);
  return URL.createObjectURL(blob);
}

/**
 * Resizes an image blob to fit within maxDimension. Outputs JPEG.
 */
export async function resizeImage(
  blob: Blob,
  maxDimension = MAX_DIMENSION,
): Promise<Blob> {
  const img = await loadImage(blob);
  let { naturalWidth: w, naturalHeight: h } = img;

  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round(h * (maxDimension / w));
      w = maxDimension;
    } else {
      w = Math.round(w * (maxDimension / h));
      h = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Resize failed.'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

/**
 * Lightweight skin-tone heuristic face detection.
 * Best-effort — warns the user but does NOT block uploads.
 */
export async function detectFace(blob: Blob): Promise<FaceDetectionResult> {
  const img = await loadImage(blob);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let skinPixels = 0;
  const totalPixels = canvas.width * canvas.height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && (r - b) > 15) {
      skinPixels++;
    }
  }

  const skinRatio = skinPixels / totalPixels;
  return { hasFace: skinRatio > 0.08, confidence: Math.min(1, skinRatio * 3) };
}

/**
 * Uploads a processed photo blob to Supabase Storage.
 * Returns the storage file path.
 */
export async function uploadPhoto(userId: string, blob: Blob): Promise<string> {
  const filePath = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return filePath;
}

/**
 * Deletes a photo from Supabase Storage.
 */
export async function deletePhoto(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Returns the public CDN URL for a stored file path.
 */
export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Checks if a URL is a Supabase storage URL (vs a local/demo path like /gallery_1.jpg).
 */
export function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('profile-photos');
}

/**
 * Extracts the storage file path from a full Supabase public URL.
 */
export function extractFilePath(publicUrl: string): string | null {
  const match = publicUrl.match(/profile-photos\/(.+)$/);
  return match ? match[1] : null;
}
