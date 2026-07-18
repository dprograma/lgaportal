"use client";

/**
 * Uploads a file straight to Cloudinary using a signature minted by
 * /api/lga-dashboard/uploads/signature. The file never touches our own
 * server, so there's no serverless body-size ceiling on it.
 */
export async function uploadToCloudinary(
  file: File,
  folder: "projects" | "press-releases"
): Promise<string> {
  const sigRes = await fetch("/api/lga-dashboard/uploads/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!sigRes.ok) {
    const err = await sigRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Could not start the upload.");
  }
  const { cloudName, apiKey, timestamp, signature, folder: signedFolder } = await sigRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", signedFolder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Upload failed.");
  }
  const data = await uploadRes.json();
  return data.secure_url as string;
}
