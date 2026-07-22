"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  Plus, Upload, ChevronDown, Eye, EyeOff, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle, FileText, FileUp, X,
} from "lucide-react";
import { STATE_COORDS } from "@/lib/nigeria-coordinates";
import { uploadAdminFile } from "@/lib/admin-upload-client";

interface AllocationRecord {
  id: string; lgaName: string; state: string;
  month: number; year: number; amount: string;
  source: string | null; isPublished: boolean;
}

const MONTH_NAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ALL_STATES  = ["", ...Object.keys(STATE_COORDS).sort()];
const currentYear = new Date().getFullYear();
const YEARS       = Array.from({ length: 10 }, (_, i) => currentYear - i);
const LIMIT       = 30;

function getAdminSecret() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminSecret") ?? localStorage.getItem("adminSecret") ?? "";
}

function fmtNaira(koboStr: string) {
  const n = Number(koboStr) / 100;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

// ─── Single-record form modal ─────────────────────────────────────────────────
function AddRecordModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ lgaName: "", state: "", month: "1", year: String(currentYear), amount: "", source: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lgaName || !form.state || !form.amount) { setError("LGA, state, and amount are required."); return; }
    setSaving(true); setError("");
    const r = await fetch("/api/admin/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify({ lgaName: form.lgaName, state: form.state, month: Number(form.month), year: Number(form.year), amount: parseFloat(form.amount), source: form.source || null }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? "Failed to save."); setSaving(false); return; }
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Add Allocation Record</h3>
        {error && <div className="mb-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">LGA Name</label>
              <input value={form.lgaName} onChange={e => setForm(f => ({...f, lgaName: e.target.value}))} placeholder="e.g. Ikeja" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">State</label>
              <select value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select…</option>
                {ALL_STATES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Month</label>
              <select value={form.month} onChange={e => setForm(f => ({...f, month: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                {MONTH_NAMES.slice(1).map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Year</label>
              <select value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Amount (₦)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" min="0" step="0.01" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Source <span className="text-slate-300">(optional)</span></label>
            <input value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))} placeholder="e.g. FAAC July 2025" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
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

// ─── CSV upload ───────────────────────────────────────────────────────────────

interface CSVRow { lgaName?: string; lga_name?: string; state?: string; month?: string; year?: string; amount?: string; source?: string }

function CSVUploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (count: number) => void }) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [rows,   setRows]   = useState<CSVRow[]>([]);
  const [status, setStatus] = useState<"idle"|"parsed"|"uploading"|"done"|"error">("idle");
  const [msg,    setMsg]    = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    Papa.parse<CSVRow>(f, {
      header: true, skipEmptyLines: true,
      complete: result => { setRows(result.data); setStatus("parsed"); setMsg(`${result.data.length} rows parsed`); },
    });
  }

  async function upload() {
    setStatus("uploading");
    const records = rows.map(r => ({
      lgaName: r.lgaName ?? r.lga_name ?? "",
      state:   r.state ?? "",
      month:   Number(r.month ?? 1),
      year:    Number(r.year ?? currentYear),
      amount:  parseFloat(r.amount ?? "0"),
      source:  r.source ?? null,
    })).filter(r => r.lgaName && r.state && r.amount > 0);

    if (!records.length) { setStatus("error"); setMsg("No valid rows found. Check CSV format."); return; }

    const r = await fetch("/api/admin/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify(records),
    });
    const d = await r.json();
    if (!r.ok) { setStatus("error"); setMsg(d.error ?? "Upload failed."); return; }
    setStatus("done");
    setMsg(`${records.length} records upserted successfully.`);
    setTimeout(() => onUploaded(records.length), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="font-bold text-slate-900 text-lg mb-1">Upload CSV</h3>
        <p className="text-xs text-slate-400 mb-4">
          CSV must have columns: <code className="bg-slate-100 px-1 rounded">lgaName, state, month, year, amount</code>
          <br />Optionally: <code className="bg-slate-100 px-1 rounded">source</code>
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
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
            status === "error"  ? "bg-red-50 text-red-700" :
            status === "done"   ? "bg-green-50 text-green-700" :
            "bg-blue-50 text-blue-700"
          }`}>
            {status === "done" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {msg}
          </div>
        )}

        {rows.length > 0 && (
          <div className="max-h-32 overflow-y-auto border border-slate-100 rounded-lg mb-4">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-400">
                <th className="text-left px-2 py-1.5">LGA</th>
                <th className="text-left px-2 py-1.5">State</th>
                <th className="px-2 py-1.5">Month</th>
                <th className="px-2 py-1.5">Year</th>
                <th className="text-right px-2 py-1.5">Amount</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5">{r.lgaName ?? r.lga_name}</td>
                    <td className="px-2 py-1.5">{r.state}</td>
                    <td className="px-2 py-1.5 text-center">{r.month}</td>
                    <td className="px-2 py-1.5 text-center">{r.year}</td>
                    <td className="px-2 py-1.5 text-right">₦{r.amount}</td>
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
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF import (best-effort extraction, reviewed before import) ────────────

interface ExtractedRow { name: string; state: string | null; amount: number }

function PdfImportModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (count: number) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"pick" | "uploading" | "extracting" | "review" | "importing" | "done" | "error">("pick");
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [source, setSource] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSource(f.name);
    setStage("uploading");
    try {
      const pdfUrl = await uploadAdminFile(f, getAdminSecret());
      setStage("extracting");
      const res = await fetch("/api/admin/allocations/pdf-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
        body: JSON.stringify({ pdfUrl }),
      });
      const d = await res.json();
      if (!res.ok) { setStage("error"); setMsg(d.error ?? "Extraction failed."); return; }
      if (!d.rows.length) { setStage("error"); setMsg("No rows could be extracted from this PDF. It may be scanned/image-based, or use a layout this tool doesn't recognise yet."); return; }
      setRows(d.rows);
      setStage("review");
    } catch (err) {
      setStage("error");
      setMsg(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function updateRow(i: number, patch: Partial<ExtractedRow>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, j) => j !== i));
  }

  async function confirmImport() {
    setStage("importing");
    const records = rows
      .filter((r) => r.name && r.state && r.amount > 0)
      .map((r) => ({ lgaName: r.name, state: r.state as string, month: Number(month), year: Number(year), amount: r.amount, source: `PDF import: ${source}` }));

    const res = await fetch("/api/admin/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify(records),
    });
    const d = await res.json();
    if (!res.ok) { setStage("error"); setMsg(d.error ?? "Import failed."); return; }
    setStage("done");
    setMsg(`${records.length} record(s) imported.`);
    setTimeout(() => onUploaded(records.length), 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-900 text-lg">Import from FAAC PDF</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Upload the official monthly disbursement PDF. Extraction is best-effort — review every row below before importing.
        </p>

        {stage === "pick" && (
          <>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 text-center hover:border-green-400 transition-colors cursor-pointer"
            >
              <FileUp className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Click to select a PDF file</p>
            </button>
          </>
        )}

        {(stage === "uploading" || stage === "extracting") && (
          <div className="py-12 text-center text-sm text-slate-400">
            {stage === "uploading" ? "Uploading PDF…" : "Extracting table rows…"}
          </div>
        )}

        {stage === "error" && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {msg}
          </div>
        )}

        {stage === "review" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Month (applies to all rows)</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                  {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Year (applies to all rows)</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                  {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">{rows.length} row(s) extracted — fix anything that looks wrong before importing:</p>
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-semibold text-slate-500">LGA Name</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-slate-500">State</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-slate-500">Amount (₦)</th>
                      <th className="px-2 py-1.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((r, i) => (
                      <tr key={i} className={!r.state || !r.name ? "bg-amber-50" : ""}>
                        <td className="px-2 py-1">
                          <input value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-green-500" />
                        </td>
                        <td className="px-2 py-1">
                          <select value={r.state ?? ""} onChange={(e) => updateRow(i, { state: e.target.value })} className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-green-500">
                            <option value="">—</option>
                            {ALL_STATES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={r.amount} onChange={(e) => updateRow(i, { amount: Number(e.target.value) })} className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-green-500" />
                        </td>
                        <td className="px-1 py-1">
                          <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.some((r) => !r.state) && (
                <p className="text-xs text-amber-600 mt-1.5">Rows highlighted above are missing a state — pick one or remove the row before importing.</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmImport}
                disabled={!rows.some((r) => r.name && r.state && r.amount > 0)}
                className="flex-1 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-40 transition-colors"
              >
                Import {rows.filter((r) => r.name && r.state && r.amount > 0).length} row(s)
              </button>
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {(stage === "importing" || stage === "done") && (
          <div className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${stage === "done" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
            {stage === "done" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {stage === "importing" ? "Importing…" : msg}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAllocationsPage() {
  const [records,  setRecords]  = useState<AllocationRecord[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const [busy,     setBusy]     = useState("");
  const [toast,    setToast]    = useState("");
  const [showAdd,  setShowAdd]  = useState(false);
  const [showCSV,  setShowCSV]  = useState(false);
  const [showPdf,  setShowPdf]  = useState(false);

  const [filterState, setFilterState] = useState("");
  const [filterYear,  setFilterYear]  = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (filterState) p.set("state", filterState);
    if (filterYear)  p.set("year",  filterYear);
    const r = await fetch(`/api/admin/allocations?${p}`, { headers: { "x-admin-secret": getAdminSecret() } });
    const d = await r.json();
    setRecords(d.records ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, filterState, filterYear]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function togglePublish(r: AllocationRecord) {
    setBusy(r.id);
    await fetch(`/api/admin/allocations/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": getAdminSecret() },
      body: JSON.stringify({ isPublished: !r.isPublished }),
    });
    setBusy("");
    showToast(r.isPublished ? "Unpublished." : "Published.");
    fetchRecords();
  }

  async function deleteRecord(id: string) {
    if (!confirm("Delete this allocation record?")) return;
    setBusy(id);
    await fetch(`/api/admin/allocations/${id}`, { method: "DELETE", headers: { "x-admin-secret": getAdminSecret() } });
    setBusy("");
    showToast("Deleted.");
    fetchRecords();
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Allocation Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage FAAC allocation data</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/allocations/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> Articles
          </Link>
          <button
            onClick={() => setShowPdf(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
          >
            <FileUp className="h-3.5 w-3.5" /> Import from PDF
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
            onChange={e => { setFilterState(e.target.value); setPage(0); }}
            className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
          >
            {ALL_STATES.map(s => <option key={s} value={s}>{s || "All States"}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="relative">
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setPage(0); }}
            className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-400 self-center">{loading ? "…" : `${total.toLocaleString()} records`}</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">LGA</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">State</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Period</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {[55,40,30,45,25,20].map((w,j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No records found.</td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.lgaName}</td>
                    <td className="px-4 py-3 text-slate-500">{r.state}</td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                      {MONTH_NAMES[r.month]} {r.year}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700 tabular-nums">{fmtNaira(r.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {r.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePublish(r)}
                          disabled={busy === r.id}
                          title={r.isPublished ? "Unpublish" : "Publish"}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40"
                        >
                          {r.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteRecord(r.id)}
                          disabled={busy === r.id}
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(0, p-1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-slate-400">Page {page+1} of {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages-1, p+1))}
              disabled={page >= pages-1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      {showAdd && <AddRecordModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchRecords(); showToast("Record saved."); }} />}
      {showCSV && <CSVUploadModal onClose={() => setShowCSV(false)} onUploaded={count => { setShowCSV(false); fetchRecords(); showToast(`${count} records imported.`); }} />}
      {showPdf && <PdfImportModal onClose={() => setShowPdf(false)} onUploaded={(count) => { setShowPdf(false); fetchRecords(); showToast(`${count} records imported from PDF.`); }} />}
    </div>
  );
}
