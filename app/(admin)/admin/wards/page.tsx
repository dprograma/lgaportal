"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import {
  Plus, Upload, Download, Trash2, Pencil, ChevronDown,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle, MapPin, X,
} from "lucide-react";
import { STATE_COORDS } from "@/lib/nigeria-coordinates";

interface WardRecord {
  id: string;
  wardName: string;
  wardNumber: number | null;
  councillorName: string;
  councillorEmail: string | null;
  councillorPhone: string | null;
  population: string | null;
  description: string | null;
  isActive: boolean;
  lga: { lgaName: string; state: string };
}

const ALL_STATES = ["", ...Object.keys(STATE_COORDS).sort()];
const LIMIT = 30;

function getAdminSecret() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminSecret") ?? localStorage.getItem("adminSecret") ?? "";
}

// ─── Single-record form modal ─────────────────────────────────────────────────
function AddWardModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    lgaName: "", state: "", wardName: "", wardNumber: "",
    councillorName: "", councillorEmail: "", councillorPhone: "", population: "", description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lgaName || !form.state || !form.wardName || !form.councillorName) {
      setError("LGA, state, ward name, and councillor name are required.");
      return;
    }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/wards", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify({
        lgaName: form.lgaName, state: form.state, wardName: form.wardName,
        wardNumber: form.wardNumber ? Number(form.wardNumber) : undefined,
        councillorName: form.councillorName,
        councillorEmail: form.councillorEmail || undefined,
        councillorPhone: form.councillorPhone || undefined,
        population: form.population || undefined,
        description: form.description || undefined,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Failed to save."); setSaving(false); return; }
    if (d.skipped?.length) { setError(d.skipped[0].reason); setSaving(false); return; }
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl max-h-[85vh] overflow-y-auto">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Add Ward Record</h3>
        {error && <div className="mb-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">LGA Name</label>
              <input value={form.lgaName} onChange={(e) => setForm((f) => ({ ...f, lgaName: e.target.value }))} placeholder="e.g. Ikeja" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">State</label>
              <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select…</option>
                {ALL_STATES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Ward Name</label>
              <input value={form.wardName} onChange={(e) => setForm((f) => ({ ...f, wardName: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Ward # <span className="text-slate-300">(optional)</span></label>
              <input type="number" min="1" value={form.wardNumber} onChange={(e) => setForm((f) => ({ ...f, wardNumber: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Councillor Name</label>
            <input value={form.councillorName} onChange={(e) => setForm((f) => ({ ...f, councillorName: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Councillor Email <span className="text-slate-300">(optional)</span></label>
              <input type="email" value={form.councillorEmail} onChange={(e) => setForm((f) => ({ ...f, councillorEmail: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Councillor Phone <span className="text-slate-300">(optional)</span></label>
              <input value={form.councillorPhone} onChange={(e) => setForm((f) => ({ ...f, councillorPhone: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Population <span className="text-slate-300">(optional)</span></label>
            <input value={form.population} onChange={(e) => setForm((f) => ({ ...f, population: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit modal ────────────────────────────────────────────────────────────────
function EditWardModal({ ward, onClose, onSaved }: { ward: WardRecord; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    wardName: ward.wardName, wardNumber: ward.wardNumber ? String(ward.wardNumber) : "",
    councillorName: ward.councillorName, councillorEmail: ward.councillorEmail ?? "",
    councillorPhone: ward.councillorPhone ?? "", population: ward.population ?? "",
    description: ward.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/wards/${ward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify({
        wardName: form.wardName,
        wardNumber: form.wardNumber ? Number(form.wardNumber) : null,
        councillorName: form.councillorName,
        councillorEmail: form.councillorEmail || null,
        councillorPhone: form.councillorPhone || null,
        population: form.population || null,
        description: form.description || null,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Failed to save."); setSaving(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Edit Ward — {ward.lga.lgaName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mb-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Ward Name</label>
            <input value={form.wardName} onChange={(e) => setForm((f) => ({ ...f, wardName: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Councillor Name</label>
            <input value={form.councillorName} onChange={(e) => setForm((f) => ({ ...f, councillorName: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="flex-1 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CSV upload ───────────────────────────────────────────────────────────────
interface CSVRow {
  lgaName?: string; state?: string; wardName?: string; wardNumber?: string;
  councillorName?: string; councillorEmail?: string; councillorPhone?: string;
  population?: string; description?: string;
}

function CSVUploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [status, setStatus] = useState<"idle" | "parsed" | "uploading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [skipped, setSkipped] = useState<{ row: number; reason: string }[]>([]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    Papa.parse<CSVRow>(f, {
      header: true, skipEmptyLines: true,
      complete: (result) => { setRows(result.data); setStatus("parsed"); setMsg(`${result.data.length} rows parsed`); },
    });
  }

  async function upload() {
    setStatus("uploading");
    const records = rows.map((r) => ({
      lgaName: r.lgaName ?? "", state: r.state ?? "", wardName: r.wardName ?? "",
      wardNumber: r.wardNumber ? Number(r.wardNumber) : undefined,
      councillorName: r.councillorName ?? "",
      councillorEmail: r.councillorEmail || undefined,
      councillorPhone: r.councillorPhone || undefined,
      population: r.population || undefined,
      description: r.description || undefined,
    })).filter((r) => r.lgaName && r.state && r.wardName && r.councillorName);

    if (!records.length) { setStatus("error"); setMsg("No valid rows found. Check CSV format."); return; }

    const res = await fetch("/api/admin/wards", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify(records),
    });
    const d = await res.json();
    if (!res.ok) { setStatus("error"); setMsg(d.error ?? "Upload failed."); return; }
    setStatus("done");
    setSkipped(d.skipped ?? []);
    setMsg(`${d.created} of ${d.total} record(s) saved.`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="font-bold text-slate-900 text-lg mb-1">Upload CSV</h3>
        <p className="text-xs text-slate-400 mb-4">
          CSV needs: <code className="bg-slate-100 px-1 rounded">lgaName, state, wardName, councillorName</code>
          <br />Optionally: <code className="bg-slate-100 px-1 rounded">wardNumber, councillorEmail, councillorPhone, population, description</code>
          <br />The LGA must already be registered — unmatched rows are skipped, never auto-created.
        </p>

        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 text-center hover:border-green-400 transition-colors cursor-pointer mb-4"
        >
          <Upload className="h-6 w-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Click to select a CSV file</p>
        </button>

        {msg && (
          <div className={`mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
            status === "error" ? "bg-red-50 text-red-700" : status === "done" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
          }`}>
            {status === "done" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {msg}
          </div>
        )}

        {skipped.length > 0 && (
          <div className="max-h-32 overflow-y-auto border border-amber-100 bg-amber-50 rounded-lg mb-4 p-2 text-xs text-amber-700">
            {skipped.map((s) => <p key={s.row}>Row {s.row}: {s.reason}</p>)}
          </div>
        )}

        {rows.length > 0 && (
          <div className="max-h-32 overflow-y-auto border border-slate-100 rounded-lg mb-4">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-400">
                <th className="text-left px-2 py-1.5">LGA</th>
                <th className="text-left px-2 py-1.5">Ward</th>
                <th className="text-left px-2 py-1.5">Councillor</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5">{r.lgaName}</td>
                    <td className="px-2 py-1.5">{r.wardName}</td>
                    <td className="px-2 py-1.5">{r.councillorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className="text-center text-xs text-slate-400 py-1.5">… and {rows.length - 5} more</p>}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={upload}
            disabled={!rows.length || status === "uploading" || status === "done"}
            className="flex-1 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-40 transition-colors"
          >
            {status === "uploading" ? "Uploading…" : status === "done" ? "Done" : `Upload ${rows.length} rows`}
          </button>
          <button onClick={() => { onClose(); if (status === "done") onUploaded(); }} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
            {status === "done" ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminWardsPage() {
  const [wards,    setWards]    = useState<WardRecord[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const [busy,     setBusy]     = useState("");
  const [toast,    setToast]    = useState("");
  const [showAdd,  setShowAdd]  = useState(false);
  const [showCSV,  setShowCSV]  = useState(false);
  const [editing,  setEditing]  = useState<WardRecord | null>(null);

  const [filterState, setFilterState] = useState("");
  const [search,       setSearch]      = useState("");

  const fetchWards = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (filterState) p.set("state", filterState);
    if (search)      p.set("search", search);
    const r = await fetch(`/api/admin/wards?${p}`, { headers: { "x-admin-secret": getAdminSecret() } });
    const d = await r.json();
    setWards(d.wards ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, filterState, search]);

  useEffect(() => { fetchWards(); }, [fetchWards]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function deleteWard(id: string) {
    if (!confirm("Delete this ward record?")) return;
    setBusy(id);
    await fetch(`/api/admin/wards/${id}`, { method: "DELETE", headers: { "x-admin-secret": getAdminSecret() } });
    setBusy("");
    showToast("Deleted.");
    fetchWards();
  }

  async function exportCsv() {
    const p = new URLSearchParams();
    if (filterState) p.set("state", filterState);
    const res = await fetch(`/api/admin/wards/export?${p}`, { headers: { "x-admin-secret": getAdminSecret() } });
    if (!res.ok) { showToast("Export failed."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ward-records-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ward Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage wards & councillors for every LGA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setShowCSV(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> CSV Import
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Record
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <div className="relative">
          <select
            value={filterState}
            onChange={(e) => { setFilterState(e.target.value); setPage(0); }}
            className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
          >
            {ALL_STATES.map((s) => <option key={s} value={s}>{s || "All States"}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search LGA or ward name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 w-56"
        />
        <p className="text-sm text-slate-400 self-center">{loading ? "…" : `${total.toLocaleString()} wards`}</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">LGA</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ward</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Councillor</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[45, 30, 35, 20, 20].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : wards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                    <MapPin className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    No ward records found.
                  </td>
                </tr>
              ) : (
                wards.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{w.lga.lgaName} <span className="text-slate-400 font-normal">({w.lga.state})</span></td>
                    <td className="px-4 py-3 text-slate-600">{w.wardName}{w.wardNumber ? ` #${w.wardNumber}` : ""}</td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{w.councillorName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${w.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {w.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(w)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteWard(w.id)}
                          disabled={busy === w.id}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-slate-400">Page {page + 1} of {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      {showAdd && <AddWardModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchWards(); showToast("Record saved."); }} />}
      {showCSV && <CSVUploadModal onClose={() => setShowCSV(false)} onUploaded={() => { fetchWards(); showToast("Import complete."); }} />}
      {editing && (
        <EditWardModal
          ward={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchWards(); showToast("Ward updated."); }}
        />
      )}
    </div>
  );
}
