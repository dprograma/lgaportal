"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Edit2, Trash2, Archive, Eye, EyeOff, ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";

interface Project {
  id: string; title: string; category: string; status: string;
  budget: string | null; isPublished: boolean; isArchived: boolean;
  startDate: string | null; expectedEndDate: string | null;
  createdAt: string; latitude: number | null; longitude: number | null;
  images: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  ROADS_INFRASTRUCTURE: "Roads",
  HEALTH: "Health",
  EDUCATION: "Education",
  WATER: "Water",
  AGRICULTURE: "Agriculture",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  ROADS_INFRASTRUCTURE: "bg-orange-100 text-orange-700",
  HEALTH:               "bg-red-100 text-red-700",
  EDUCATION:            "bg-blue-100 text-blue-700",
  WATER:                "bg-teal-100 text-teal-700",
  AGRICULTURE:          "bg-green-100 text-green-700",
  OTHER:                "bg-slate-100 text-slate-600",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
};

function fmtNaira(koboStr: string) {
  const n = Number(koboStr) / 100;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

function getLgaId() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("lgaId");
}

const TABS = ["ALL","PENDING","IN_PROGRESS","COMPLETED","ARCHIVED"] as const;
type Tab = typeof TABS[number];
const LIMIT = 20;

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [confirm,   setConfirm]   = useState<{ type: "delete"|"archive"; id: string } | null>(null);
  const [busy,      setBusy]      = useState("");

  const fetchProjects = useCallback(async () => {
    const lgaId = getLgaId();
    if (!lgaId) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (activeTab === "ARCHIVED") {
      params.set("archived", "true");
    } else {
      params.set("archived", "false");
      if (activeTab !== "ALL") params.set("status", activeTab);
    }
    const r = await fetch(`/api/lga-dashboard/projects?${params}`, { headers: { "x-lga-id": lgaId } });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? "Failed to load projects."); setLoading(false); return; }
    setProjects(d.projects ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [activeTab, page]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { setPage(0); }, [activeTab]);

  async function togglePublish(id: string, current: boolean) {
    const lgaId = getLgaId();
    if (!lgaId) return;
    setBusy(id);
    await fetch(`/api/lga-dashboard/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
      body: JSON.stringify({ isPublished: !current }),
    });
    setBusy("");
    fetchProjects();
  }

  async function deleteProject(id: string) {
    const lgaId = getLgaId();
    if (!lgaId) return;
    setBusy(id);
    await fetch(`/api/lga-dashboard/projects/${id}`, { method: "DELETE", headers: { "x-lga-id": lgaId } });
    setBusy("");
    setConfirm(null);
    fetchProjects();
  }

  async function archiveProject(id: string) {
    const lgaId = getLgaId();
    if (!lgaId) return;
    setBusy(id);
    await fetch(`/api/lga-dashboard/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
      body: JSON.stringify({ isArchived: true }),
    });
    setBusy("");
    setConfirm(null);
    fetchProjects();
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your LGA's development projects</p>
        </div>
        <Link
          href="/lga-dashboard/projects/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 overflow-x-auto mb-5 bg-slate-100 p-1 rounded-xl w-fit max-w-full">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "IN_PROGRESS" ? "In Progress" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Project cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="h-12 w-12 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Archive className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No projects yet</p>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === "ALL"
              ? "Create your first project to get started."
              : `No ${activeTab.toLowerCase().replace("_", " ")} projects found.`}
          </p>
          {activeTab === "ALL" && (
            <Link href="/lga-dashboard/projects/new" className="inline-block mt-4 px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition-colors">
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start gap-3">
                {/* Image or placeholder */}
                <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                  {p.images[0]
                    ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center text-xl">🏗️</div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] ?? "bg-slate-100 text-slate-500"}`}>
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {p.status.replace("_", " ")}
                    </span>
                    {p.isArchived && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Archived</span>
                    )}
                    {!p.isPublished && !p.isArchived && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">Draft</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{p.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                    {p.budget && <span>Budget: <strong className="text-slate-600">{fmtNaira(p.budget)}</strong></span>}
                    {p.startDate && <span>Start: {new Date(p.startDate).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>}
                    {(p.latitude && p.longitude) && <span>📍 Mapped</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!p.isArchived && (
                    <>
                      <button
                        onClick={() => togglePublish(p.id, p.isPublished)}
                        disabled={busy === p.id}
                        title={p.isPublished ? "Unpublish" : "Publish"}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40"
                      >
                        {p.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <Link
                        href={`/lga-dashboard/projects/${p.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => setConfirm({ type: "archive", id: p.id })}
                        disabled={busy === p.id}
                        title="Archive"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors disabled:opacity-40"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "delete", id: p.id })}
                        disabled={busy === p.id}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <span className="text-sm text-slate-500">Page {page+1} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages-1, p+1))} disabled={page>=pages-1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              {confirm.type === "delete" ? "Delete Project?" : "Archive Project?"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {confirm.type === "delete"
                ? "This action is permanent and cannot be undone."
                : "Archived projects remain visible on the map but cannot be edited."}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => confirm.type === "delete" ? deleteProject(confirm.id) : archiveProject(confirm.id)}
                disabled={!!busy}
                className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                  confirm.type === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {busy ? "Please wait…" : confirm.type === "delete" ? "Delete" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
