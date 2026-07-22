"use client";

/**
 * Uploads a file straight to Cloudinary (admin surface) using a signature
 * minted by /api/admin/uploads/signature. Mirrors lib/upload-client.ts but
 * authorises via the admin secret instead of an LGA session.
 */
export async function uploadAdminFile(file: File, adminSecret: string): Promise<string> {
  const sigRes = await fetch("/api/admin/uploads/signature", {
    method: "POST",
    headers: { "x-admin-secret": adminSecret },
  });
  if (!sigRes.ok) {
    const err = await sigRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Could not start the upload.");
  }
  const { cloudName, apiKey, timestamp, signature, folder } = await sigRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

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
