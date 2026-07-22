"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadToCloudinary } from "@/lib/upload-client";

interface Props {
  folder: "projects" | "press-releases";
  accept: string;
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
  label?: string;
  className?: string;
}

/** A button that uploads a chosen file straight to Cloudinary and reports back the resulting URL. */
export default function UploadButton({ folder, accept, onUploaded, onError, label = "Upload", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, folder);
      onUploaded(url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={className ?? "flex items-center gap-1.5 px-3 py-2.5 bg-slate-700 text-white text-sm rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? "Uploading…" : label}
      </button>
    </>
  );
}
