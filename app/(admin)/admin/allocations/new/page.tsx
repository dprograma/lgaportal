"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, AlertCircle, CheckCircle, Plus, X, Calendar } from "lucide-react";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), { ssr: false });

interface Article {
  id: string; title: string; slug: string; content: string;
  month: number | null; year: number | null;
  coverImage: string | null; attachments: string[];
  status: string; scheduledAt: string | null;
}

const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const YEARS       = Array.from({ length: 10 }, (_, i) => currentYear - i);

function getAdminSecret() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminSecret") ?? localStorage.getItem("adminSecret") ?? "";
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminArticleEditorPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-green-600 animate-spin" /></div>}>
      <AdminArticleEditorPage />
    </Suspense>
  );
}

function AdminArticleEditorPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("id"); // edit mode if present

  const [loading, setLoading] = useState(!!editId);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title:       "",
    slug:        "",
    content:     "",
    month:       "",
    year:        String(currentYear),
    coverImage:  "",
    status:      "DRAFT",
    scheduledAt: "",
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachInput, setAttachInput] = useState("");
  const [slugDirty,   setSlugDirty]   = useState(false);

  // Load article if editing
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/admin/allocations/articles/${editId}`, {
      headers: { "x-admin-secret": getAdminSecret() },
    })
      .then(r => r.json())
      .then(d => {
        const a: Article = d.article;
        setForm({
          title:       a.title,
          slug:        a.slug,
          content:     a.content,
          month:       a.month ? String(a.month) : "",
          year:        a.year ? String(a.year) : String(currentYear),
          coverImage:  a.coverImage ?? "",
          status:      a.status,
          scheduledAt: a.scheduledAt ? a.scheduledAt.split("T")[0] : "",
        });
        setAttachments(a.attachments ?? []);
        setSlugDirty(true); // don't auto-update slug in edit mode
        setLoading(false);
      });
  }, [editId]);

  function set(k: string, v: unknown) {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Auto-slug from title unless user has edited it
      if (k === "title" && !slugDirty) {
        next.slug = slugify(v as string);
      }
      return next;
    });
  }

  function addAttachment() {
    const v = attachInput.trim();
    if (v && !attachments.includes(v)) { setAttachments(p => [...p, v]); setAttachInput(""); }
  }

  async function save(status: string) {
    if (!form.title.trim())   { setError("Title is required."); return; }
    if (!form.content.trim()) { setError("Content is required."); return; }
    setSaving(true); setError(""); setSuccess("");

    const body = {
      title:       form.title.trim(),
      slug:        form.slug.trim() || slugify(form.title),
      content:     form.content,
      month:       form.month ? Number(form.month) : null,
      year:        form.year  ? Number(form.year)  : null,
      coverImage:  form.coverImage  || null,
      attachments,
      status,
      scheduledAt: status === "SCHEDULED" && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    };

    const url    = editId ? `/api/admin/allocations/articles/${editId}` : "/api/admin/allocations/articles";
    const method = editId ? "PATCH" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? "Failed to save."); setSaving(false); return; }

    setSuccess(status === "PUBLISHED" ? "Article published!" : status === "SCHEDULED" ? "Article scheduled." : "Draft saved.");
    setSaving(false);
    if (!editId) {
      // Redirect to edit mode with the new id
      router.replace(`/admin/allocations/new?id=${d.article.id}`);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-slate-100 rounded-lg" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/allocations" className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{editId ? "Edit" : "New"} Allocation Article</h1>
          <p className="text-xs text-slate-400">Publish allocation news and analysis</p>
        </div>
        {editId && (
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
            form.status === "PUBLISHED"  ? "bg-green-100 text-green-700" :
            form.status === "SCHEDULED"  ? "bg-blue-100 text-blue-700"  :
            "bg-slate-100 text-slate-500"
          }`}>
            {form.status}
          </span>
        )}
      </div>

      {error   && <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {success && <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700"><CheckCircle className="h-4 w-4 shrink-0" />{success}</div>}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="e.g. FAAC Allocation – July 2025"
            maxLength={200}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">URL Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={e => { setSlugDirty(true); set("slug", slugify(e.target.value)); }}
            placeholder="faac-allocation-july-2025"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-green-500 font-mono"
          />
          <p className="text-xs text-slate-400 mt-1">Auto-generated from title. Used in the article URL.</p>
        </div>

        {/* Period */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Allocation Month</label>
            <select
              value={form.month}
              onChange={e => set("month", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Not specified</option>
              {MONTH_NAMES.slice(1).map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Allocation Year</label>
            <select
              value={form.year}
              onChange={e => set("year", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Not specified</option>
              {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Content <span className="text-red-500">*</span></label>
          <RichTextEditor
            value={form.content}
            onChange={v => set("content", v)}
            placeholder="Write the allocation news article here…"
            maxChars={20_000}
            minHeight={300}
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Cover Image URL</label>
          <input
            type="url"
            value={form.coverImage}
            onChange={e => set("coverImage", e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
          />
          {form.coverImage && (
            <img src={form.coverImage} alt="Cover preview" className="mt-2 h-24 w-40 object-cover rounded-lg border border-slate-200" />
          )}
        </div>

        {/* Attachments */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Attachments <span className="text-xs font-normal text-slate-400">(PDF / image URLs)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={attachInput}
              onChange={e => setAttachInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAttachment(); }}}
              placeholder="Paste file URL…"
              className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={addAttachment}
              className="flex items-center gap-1 px-3 py-2.5 bg-slate-700 text-white text-sm rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-600 flex-1 truncate">{a}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(p => p.filter((_,j) => j !== i))}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish options */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Publishing</p>
          <div className="space-y-2">
            {(["DRAFT","PUBLISHED","SCHEDULED"] as const).map(s => (
              <label key={s} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={form.status === s}
                  onChange={() => set("status", s)}
                  className="accent-green-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.charAt(0) + s.slice(1).toLowerCase()}</p>
                  <p className="text-xs text-slate-400">
                    {s === "DRAFT"     ? "Save privately, not visible to public." :
                     s === "PUBLISHED" ? "Make visible immediately." :
                     "Schedule for a future date."}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {form.status === "SCHEDULED" && (
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-3.5 w-3.5" /> Publish Date
              </label>
              <input
                type="date"
                value={form.scheduledAt}
                onChange={e => set("scheduledAt", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => save(form.status)}
            disabled={saving}
            className="flex-1 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" :
             form.status === "PUBLISHED"  ? "Save & Publish" :
             form.status === "SCHEDULED"  ? "Save & Schedule" :
             "Save Draft"}
          </button>
          {form.status !== "PUBLISHED" && (
            <button
              type="button"
              onClick={() => save("PUBLISHED")}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Publish Now
            </button>
          )}
          <Link href="/admin/allocations" className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
