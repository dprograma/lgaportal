"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, AlertCircle, MapPin, Upload, X, Plus } from "lucide-react";
import UploadButton from "@/components/lga-dashboard/UploadButton";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), { ssr: false });

const CATEGORIES = [
  { value: "ROADS_INFRASTRUCTURE", label: "Roads & Infrastructure" },
  { value: "HEALTH",               label: "Health"                 },
  { value: "EDUCATION",            label: "Education"              },
  { value: "WATER",                label: "Water"                  },
  { value: "AGRICULTURE",          label: "Agriculture"            },
  { value: "OTHER",                label: "Other"                  },
];

const STATUSES = [
  { value: "PENDING",     label: "Pending"     },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED",   label: "Completed"   },
];

function getLgaId() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("lgaId");
}

export default function NewProjectPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title:           "",
    description:     "",
    category:        "ROADS_INFRASTRUCTURE",
    status:          "PENDING",
    budget:          "",
    startDate:       "",
    expectedEndDate: "",
    videoUrl:        "",
    isPublished:     false,
  });
  const [latitude,  setLatitude]  = useState("");
  const [longitude, setLongitude] = useState("");
  const [images,    setImages]    = useState<string[]>([]);
  const [imageInput,setImageInput]= useState("");
  const [error,     setError]     = useState("");
  const [saving,    setSaving]    = useState(false);

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  function addImage() {
    const v = imageInput.trim();
    if (v && !images.includes(v)) { setImages(p => [...p, v]); setImageInput(""); }
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    const lgaId = getLgaId();
    if (!lgaId) { setError("Session expired. Please sign in again."); return; }
    if (!form.title.trim())       { setError("Title is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }

    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      title:       form.title.trim(),
      description: form.description,
      category:    form.category,
      status:      form.status,
      isPublished: publish,
    };
    if (form.budget)          body.budget          = parseFloat(form.budget);
    if (form.startDate)       body.startDate       = form.startDate;
    if (form.expectedEndDate) body.expectedEndDate = form.expectedEndDate;
    if (form.videoUrl)        body.videoUrl        = form.videoUrl;
    if (latitude && longitude) {
      body.latitude  = parseFloat(latitude);
      body.longitude = parseFloat(longitude);
    }
    if (images.length) body.images = images;

    const r = await fetch("/api/lga-dashboard/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? "Failed to create project."); setSaving(false); return; }
    router.push("/lga-dashboard/projects");
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lga-dashboard/projects" className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Project</h1>
          <p className="text-xs text-slate-400">Create a development project for your LGA</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={e => handleSubmit(e, form.isPublished)} className="space-y-5">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="e.g. Rehabilitation of Market Road"
            maxLength={150}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Category + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => set("status", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={form.description}
            onChange={v => set("description", v)}
            placeholder="Describe the project, its goals, and expected impact…"
            maxChars={2000}
            minHeight={180}
          />
        </div>

        {/* Budget + Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Budget (₦)</label>
            <input
              type="number"
              value={form.budget}
              onChange={e => set("budget", e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => set("startDate", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Expected End</label>
            <input
              type="date"
              value={form.expectedEndDate}
              onChange={e => set("expectedEndDate", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Coordinates */}
        <div>
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" /> Location Coordinates
            <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Latitude</label>
              <input
                type="number"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="e.g. 6.4560"
                step="any"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Longitude</label>
              <input
                type="number"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="e.g. 7.5103"
                step="any"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Adding coordinates pins the project on the public map. You can find coordinates via Google Maps.</p>
        </div>

        {/* Images */}
        <div>
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Upload className="h-3.5 w-3.5 text-slate-400" /> Images
            <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addImage(); }}}
              placeholder="Paste image URL…"
              className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={addImage}
              className="flex items-center gap-1 px-3 py-2.5 bg-green-700 text-white text-sm rounded-xl hover:bg-green-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
            <UploadButton
              folder="projects"
              accept="image/*"
              label="Upload"
              onUploaded={(url) => setImages(p => [...p, url])}
              onError={setError}
            />
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Video <span className="text-xs font-normal text-slate-400">(optional)</span></label>
          <div className="flex gap-2">
            <input
              type="url"
              value={form.videoUrl}
              onChange={e => set("videoUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=… or upload a file"
              className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
            <UploadButton
              folder="projects"
              accept="video/*"
              label="Upload"
              onUploaded={(url) => set("videoUrl", url)}
              onError={setError}
            />
          </div>
        </div>

        {/* Publish toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("isPublished", !form.isPublished)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${form.isPublished ? "bg-green-600" : "bg-slate-200"}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${form.isPublished ? "translate-x-4" : "translate-x-0"}`} />
          </div>
          <span className="text-sm font-medium text-slate-700">Publish immediately</span>
          <span className="text-xs text-slate-400">(visible on the public map)</span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : form.isPublished ? "Save & Publish" : "Save as Draft"}
          </button>
          <Link href="/lga-dashboard/projects" className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
