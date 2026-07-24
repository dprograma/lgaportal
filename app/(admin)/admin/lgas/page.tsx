"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import {
  Building2, Search, CheckCircle, XCircle, Clock, BadgeCheck,
  ChevronDown, AlertCircle, ShieldOff, Power, Pencil, Download, Upload, X,
} from "lucide-react";
import { toast } from "sonner";

const adminSecret = () => sessionStorage.getItem("adminSecret") ?? "";

type Status = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

interface LGAItem {
  id: string;
  lgaName: string;
  state: string;
  chairmanName: string;
  email: string;
  phone: string;
  status: string;
  isVerified: boolean;
  tenureStatus: string;
  freeUntil: string | null;
  createdAt: string;
  _count: { verificationDocs: number };
}

const STATUS_TABS: { label: string; value: Status; color: string }[] = [
  { label: "All",       value: "ALL",       color: "text-slate-600"  },
  { label: "Pending",   value: "PENDING",   color: "text-amber-700"  },
  { label: "Approved",  value: "APPROVED",  color: "text-green-700"  },
  { label: "Rejected",  value: "REJECTED",  color: "text-red-700"    },
  { label: "Suspended", value: "SUSPENDED", color: "text-slate-500"  },
];

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    PENDING:   "bg-amber-100 text-amber-800",
    APPROVED:  "bg-green-100 text-green-800",
    REJECTED:  "bg-red-100 text-red-800",
    SUSPENDED: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

// ─── Edit profile fields (single record) ──────────────────────────────────────

interface LgaProfile {
  id: string; lgaName: string; state: string; chairmanName: string; email: string;
  phone: string; officeAddress: string; population: string | null; description: string | null;
  logoUrl: string | null;
}

function EditLgaModal({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [form, setForm] = useState({
    lgaName: "", state: "", chairmanName: "", phone: "",
    officeAddress: "", population: "", description: "", logoUrl: "",
  });

  useEffect(() => {
    fetch(`/api/admin/lgas/${id}`, { headers: { "x-admin-secret": adminSecret() } })
      .then((r) => r.json())
      .then((d) => {
        const l: LgaProfile = d.lga;
        setForm({
          lgaName: l.lgaName, state: l.state, chairmanName: l.chairmanName, phone: l.phone,
          officeAddress: l.officeAddress, population: l.population ?? "",
          description: l.description ?? "", logoUrl: l.logoUrl ?? "",
        });
        setLoading(false);
      })
      .catch(() => { setError("Failed to load LGA."); setLoading(false); });
  }, [id]);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/lgas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
      body: JSON.stringify({
        ...form,
        population:  form.population || null,
        description: form.description || null,
        logoUrl:     form.logoUrl || null,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Failed to save."); setSaving(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Edit LGA Record</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
        ) : (
          <div className="space-y-3">
            {error && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">LGA Name</label>
                <input value={form.lgaName} onChange={(e) => set("lgaName", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">State</label>
                <input value={form.state} onChange={(e) => set("state", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Chairman Name</label>
              <input value={form.chairmanName} onChange={(e) => set("chairmanName", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Population</label>
                <input value={form.population} onChange={(e) => set("population", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Office Address</label>
              <input value={form.officeAddress} onChange={(e) => set("officeAddress", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Logo URL</label>
              <input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <p className="text-xs text-slate-400">Email, login, and account status aren&rsquo;t editable here — this only corrects the LGA&rsquo;s official record.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving} className="flex-1 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bulk-correct via CSV ──────────────────────────────────────────────────────

interface BulkCsvRow {
  email?: string; lgaName?: string; state?: string; chairmanName?: string;
  phone?: string; officeAddress?: string; population?: string; description?: string; logoUrl?: string;
}

function BulkCorrectModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkCsvRow[]>([]);
  const [status, setStatus] = useState<"idle" | "parsed" | "uploading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ updated: number; skipped: { row: number; reason: string }[] } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    Papa.parse<BulkCsvRow>(f, {
      header: true, skipEmptyLines: true,
      complete: (result) => { setRows(result.data); setStatus("parsed"); setMsg(`${result.data.length} rows parsed`); },
    });
  }

  async function upload() {
    setStatus("uploading");
    const res = await fetch("/api/admin/lgas/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
      body: JSON.stringify(rows),
    });
    const d = await res.json();
    if (!res.ok) { setStatus("error"); setMsg(d.error ?? "Upload failed."); return; }
    setStatus("done");
    setResult(d);
    setMsg(`${d.updated} of ${d.total} record(s) corrected.`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="font-bold text-slate-900 text-lg mb-1">Bulk-Correct LGA Records</h3>
        <p className="text-xs text-slate-400 mb-4">
          CSV needs an identifier per row — <code className="bg-slate-100 px-1 rounded">email</code> (preferred)
          or both <code className="bg-slate-100 px-1 rounded">lgaName</code> + <code className="bg-slate-100 px-1 rounded">state</code> —
          plus any fields to correct. Only already-registered LGAs are updated; unmatched rows are skipped.
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

        {result && result.skipped.length > 0 && (
          <div className="max-h-32 overflow-y-auto border border-amber-100 bg-amber-50 rounded-lg mb-4 p-2 text-xs text-amber-700">
            {result.skipped.map((s) => <p key={s.row}>Row {s.row}: {s.reason}</p>)}
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
          <button onClick={() => { onClose(); if (status === "done") onDone(); }} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
            {status === "done" ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLGAsPage() {
  const [lgas,       setLgas]       = useState<LGAItem[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<Status>("ALL");
  const [search,     setSearch]     = useState("");
  const [dSearch,    setDSearch]    = useState("");
  const [page,       setPage]       = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId,     setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting,       setActing]       = useState<string | null>(null);
  const [stateFilter,  setStateFilter]  = useState("");
  const [editId,       setEditId]       = useState<string | null>(null);
  const [showBulk,     setShowBulk]     = useState(false);
  const [singleUploadId, setSingleUploadId] = useState<string | null>(null);
  const singleUploadRef = useRef<HTMLInputElement>(null);
  const PAGE = 25;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [tab, stateFilter]);

  const fetchLgas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE), offset: String(page * PAGE),
      status: tab,
      ...(dSearch      ? { search: dSearch }          : {}),
      ...(stateFilter  ? { state: stateFilter }        : {}),
    });
    try {
      const res = await fetch(`/api/admin/lgas?${params}`, {
        headers: { "x-admin-secret": adminSecret() },
      });
      const data = await res.json();
      setLgas(data.lgas ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load LGAs.");
    } finally {
      setLoading(false);
    }
  }, [tab, dSearch, page, stateFilter]);

  useEffect(() => { fetchLgas(); }, [fetchLgas]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/lgas/${id}/approve`, {
        method: "POST",
        headers: { "x-admin-secret": adminSecret() },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      fetchLgas();
    } catch { toast.error("Action failed."); }
    finally { setActing(null); }
  };

  const reject = async () => {
    if (!rejectId || rejectReason.length < 10) {
      toast.error("Rejection reason must be at least 10 characters.");
      return;
    }
    setActing(rejectId);
    try {
      const res = await fetch(`/api/admin/lgas/${rejectId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setRejectId(null);
      setRejectReason("");
      fetchLgas();
    } catch { toast.error("Action failed."); }
    finally { setActing(null); }
  };

  const changeStatus = async (id: string, status: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/lgas/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      fetchLgas();
    } catch { toast.error("Action failed."); }
    finally { setActing(null); }
  };

  async function exportCsv() {
    const params = new URLSearchParams({ status: tab });
    if (dSearch)     params.set("search", dSearch);
    if (stateFilter) params.set("state", stateFilter);
    const res = await fetch(`/api/admin/lgas/export?${params}`, { headers: { "x-admin-secret": adminSecret() } });
    if (!res.ok) { toast.error("Export failed."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lga-records-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadSingleCsv(id: string) {
    const res = await fetch(`/api/admin/lgas/export?id=${id}`, { headers: { "x-admin-secret": adminSecret() } });
    if (!res.ok) { toast.error("Download failed."); return; }
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filename = disposition.match(/filename="(.+)"/)?.[1] ?? `lga-${id}.csv`;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function triggerSingleUpload(id: string) {
    setSingleUploadId(id);
    singleUploadRef.current?.click();
  }

  function handleSingleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = singleUploadId;
    e.target.value = "";
    if (!file || !id) return;

    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: async (result) => {
        const row = result.data[0];
        if (!row) { toast.error("CSV has no data rows."); return; }
        const body: Record<string, string> = {};
        for (const key of ["lgaName", "state", "chairmanName", "phone", "officeAddress", "population", "description", "logoUrl"]) {
          if (row[key]) body[key] = row[key];
        }
        const res = await fetch(`/api/admin/lgas/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
          body: JSON.stringify(body),
        });
        const d = await res.json();
        if (!res.ok) { toast.error(d.error ?? "Upload failed."); return; }
        toast.success("LGA record updated from CSV.");
        fetchLgas();
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">LGA Approvals</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total.toLocaleString()} total registrations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Bulk Correct
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {STATUS_TABS.map(({ label, value, color }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === value ? "bg-white shadow-sm text-slate-900" : `${color} hover:bg-white/60`
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + State filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search LGA name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100"
          />
        </div>
        <input
          type="text"
          placeholder="Filter by state…"
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setPage(0); }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 w-44"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="h-16 px-6 flex items-center gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : lgas.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No LGAs found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {lgas.map((lga) => (
              <div key={lga.id}>
                {/* Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                      {lga.lgaName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 truncate">{lga.lgaName} LGA</span>
                        {lga.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                        <StatusBadge status={lga.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {lga.state} · {lga.chairmanName} · {lga._count.verificationDocs} doc{lga._count.verificationDocs !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end sm:shrink-0">
                    {lga.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => approve(lga.id)}
                          disabled={acting === lga.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(lga.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {lga.status === "APPROVED" && (
                      <button
                        onClick={() => changeStatus(lga.id, "SUSPENDED")}
                        disabled={acting === lga.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                        Suspend
                      </button>
                    )}
                    {(lga.status === "APPROVED" || lga.status === "SUSPENDED") && (
                      <button
                        onClick={() => changeStatus(lga.id, lga.status === "SUSPENDED" ? "APPROVED" : "DEACTIVATED")}
                        disabled={acting === lga.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 ${
                          lga.status === "SUSPENDED"
                            ? "border-green-200 text-green-700 hover:bg-green-50"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" />
                        {lga.status === "SUSPENDED" ? "Reactivate" : "Deactivate"}
                      </button>
                    )}
                    {lga.status === "DEACTIVATED" && (
                      <button
                        onClick={() => changeStatus(lga.id, "APPROVED")}
                        disabled={acting === lga.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Power className="h-3.5 w-3.5" />
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => setEditId(lga.id)}
                      title="Edit record"
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => downloadSingleCsv(lga.id)}
                      title="Download this LGA's record as CSV"
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => triggerSingleUpload(lga.id)}
                      title="Upload a CSV to correct this LGA's record"
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === lga.id ? null : lga.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === lga.id ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expandedId === lga.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs text-slate-600">
                          <div><span className="font-medium">Email:</span> {lga.email}</div>
                          <div><span className="font-medium">Phone:</span> {lga.phone}</div>
                          <div><span className="font-medium">Tenure:</span> {lga.tenureStatus}</div>
                          <div><span className="font-medium">Free Until:</span> {lga.freeUntil ? new Date(lga.freeUntil).toLocaleDateString() : "N/A"}</div>
                          <div><span className="font-medium">Registered:</span> {new Date(lga.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(total / PAGE) > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40 hover:border-green-400 transition-colors">
              ← Prev
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE >= total}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40 hover:border-green-400 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setRejectId(null); setRejectReason(""); } }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Reject LGA Registration</h3>
                  <p className="text-xs text-slate-500">The chairman will receive an email with your reason</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection (min 10 characters)…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectId(null); setRejectReason(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={reject}
                  disabled={rejectReason.length < 10 || !!acting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editId && (
        <EditLgaModal
          id={editId}
          onClose={() => setEditId(null)}
          onSaved={() => { setEditId(null); toast.success("LGA record updated."); fetchLgas(); }}
        />
      )}
      {showBulk && (
        <BulkCorrectModal onClose={() => setShowBulk(false)} onDone={fetchLgas} />
      )}
      <input ref={singleUploadRef} type="file" accept=".csv" onChange={handleSingleUploadFile} className="hidden" />
    </div>
  );
}

