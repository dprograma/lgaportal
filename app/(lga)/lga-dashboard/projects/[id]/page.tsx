"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, AlertCircle, MapPin, Plus, X, Clock, User } from "lucide-react";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), { ssr: false });

interface StatusLog { id: string; oldStatus: string; newStatus: string; note: string | null; changedBy: string; createdAt: string; }
interface Project {
  id: string; title: string; description: string; category: string; status: string;
  budget: string | null; isPublished: boolean; isArchived: boolean;
  startDate: string | null; expectedEndDate: string | null;
  latitude: number | null; longitude: number | null;
  images: string[]; videoUrl: string | null;
  statusLogs: StatusLog[];
}

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

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "text-amber-700 bg-amber-50",
  IN_PROGRESS: "text-blue-700 bg-blue-50",
  COMPLETED:   "text-green-700 bg-green-50",
};

function getLgaId() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("lgaId");
}

function fmtBudget(koboStr: string | null) {
  if (!koboStr) return "";
  return String(Number(koboStr) / 100);
}

export default function EditProjectPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", category: "ROADS_INFRASTRUCTURE",
    status: "PENDING", budget: "", startDate: "", expectedEndDate: "",
    videoUrl: "", isPublished: false,
  });
  const [latitude,   setLatitude]   = useState("");
  const [longitude,  setLongitude]  = useState("");
  const [images,     setImages]     = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    const lgaId = getLgaId();
    if (!lgaId) return;
    fetch(`/api/lga-dashboard/projects/${id}`, { headers: { "x-lga-id": lgaId } })
      .then(r => r.json())
      .then(d => {
        const p: Project = d.project;
        setProject(p);
        setForm({
          title:           p.title,
          description:     p.description,
          category:        p.category,
          status:          p.status,
          budget:          fmtBudget(p.budget),
          startDate:       p.startDate ? p.startDate.split("T")[0] : "",
          expectedEndDate: p.expectedEndDate ? p.expectedEndDate.split("T")[0] : "",
          videoUrl:        p.videoUrl ?? "",
          isPublished:     p.isPublished,
        });
        setLatitude(p.latitude != null ? String(p.latitude) : "");
        setLongitude(p.longitude != null ? String(p.longitude) : "");
        setImages(p.images ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load project."); setLoading(false); });
  }, [id]);

  function setField(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  function addImage() {
    const v = imageInput.trim();
    if (v && !images.includes(v)) { setImages(p => [...p, v]); setImageInput(""); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const lgaId = getLgaId();
    if (!lgaId) { setError("Session expired."); return; }
    setSaving(true); setError(""); setSuccess("");

    const body: Record<string, unknown> = {
      title:       form.title.trim(),
      description: form.description,
      category:    form.category,
      status:      form.status,
      isPublished: form.isPublished,
      images,
      videoUrl:    form.videoUrl || null,
    };
    if (form.budget)          body.budget          = parseFloat(form.budget);
    if (form.startDate)       body.startDate       = form.startDate;
    if (form.expectedEndDate) body.expectedEndDate = form.expectedEndDate;
    if (latitude && longitude) {
      body.latitude  = parseFloat(latitude);
      body.longitude = parseFloat(longitude);
    } else {
      body.latitude  = null;
      body.longitude = null;
    }
    if (form.status !== project?.status) body.statusNote = statusNote;

    const r = await fetch(`/api/lga-dashboard/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? "Failed to save."); setSaving(false); return; }

    setProject(d.project);
    setSuccess("Project saved successfully.");
    setSaving(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-slate-100 rounded-lg" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-16">
        <p className="text-slate-500">Project not found.</p>
        <Link href="/lga-dashboard/projects" className="text-green-700 text-sm mt-2 inline-block hover:underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lga-dashboard/projects" className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">Edit Project</h1>
          <p className="text-xs text-slate-400 truncate">{project.title}</p>
        </div>
        {project.isArchived && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Archived</span>
        )}
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          {success}
        </div>
      )}

      {project.isArchived ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-5">
          This project is archived and cannot be edited. Contact admin to restore it.
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => setField("title", e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setField("category", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setField("status", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Status change note */}
          {form.status !== project.status && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs font-medium text-blue-700 mb-1.5">
                Status change: <strong>{project.status.replace("_"," ")}</strong> → <strong>{form.status.replace("_"," ")}</strong>
              </p>
              <input
                type="text"
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder="Optional note (e.g. contractor mobilised, phase 1 complete)"
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Description <span className="text-red-500">*</span></label>
            <RichTextEditor
              value={form.description}
              onChange={v => setField("description", v)}
              placeholder="Describe the project…"
              maxChars={2000}
              minHeight={150}
            />
          </div>

          {/* Budget + Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Budget (₦)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => setField("budget", e.target.value)}
                min="0" step="0.01" placeholder="0.00"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setField("startDate", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Expected End</label>
              <input
                type="date"
                value={form.expectedEndDate}
                onChange={e => setField("expectedEndDate", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div>
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Location Coordinates
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
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Images</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={imageInput}
                onChange={e => setImageInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addImage(); }}}
                placeholder="Paste image URL…"
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="button" onClick={addImage} className="flex items-center gap-1 px-3 py-2.5 bg-slate-700 text-white text-sm rounded-xl hover:bg-slate-800 transition-colors">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setImages(p => p.filter((_,j) => j !== i))}
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
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Video URL</label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={e => setField("videoUrl", e.target.value)}
              placeholder="https://youtube.com/…"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setField("isPublished", !form.isPublished)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${form.isPublished ? "bg-green-600" : "bg-slate-200"}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${form.isPublished ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">Published</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <Link href="/lga-dashboard/projects" className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      )}

      {/* Status History */}
      {project.statusLogs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
            <Clock className="h-3.5 w-3.5 text-slate-400" /> Status History
          </h2>
          <div className="space-y-2">
            {project.statusLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3 w-3 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1 ${STATUS_COLORS[log.oldStatus] ?? "bg-slate-100 text-slate-500"}`}>
                      {log.oldStatus.replace("_"," ")}
                    </span>
                    →
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1 ${STATUS_COLORS[log.newStatus] ?? "bg-slate-100 text-slate-500"}`}>
                      {log.newStatus.replace("_"," ")}
                    </span>
                  </p>
                  {log.note && <p className="text-xs text-slate-500 mt-0.5 italic">{log.note}</p>}
                </div>
                <time className="text-[10px] text-slate-400 shrink-0">{new Date(log.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
