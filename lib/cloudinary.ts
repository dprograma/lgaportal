import { v2 as cloudinary } from "cloudinary";

/**
 * Signed direct-to-Cloudinary uploads. The browser uploads the file straight
 * to Cloudinary using a short-lived signature this server issues — the file
 * itself never passes through our own API route, so there's no exposure to
 * Vercel's ~4.5MB serverless request-body limit (which would otherwise make
 * video uploads impossible).
 *
 * Configure via CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY /
 * CLOUDINARY_API_SECRET. When unset, isCloudinaryConfigured() returns false
 * so callers can surface a clear "not configured" error instead of crashing.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/** Sign the exact params the client will send with its direct upload. */
export function createUploadSignature(folder: string): UploadSignature {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    API_SECRET
  );
  return { cloudName: CLOUD_NAME, apiKey: API_KEY, timestamp, signature, folder };
}
