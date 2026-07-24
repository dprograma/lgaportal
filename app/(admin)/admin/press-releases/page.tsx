"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Plus, Search, Check, X, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const adminSecret = () => sessionStorage.getItem("adminSecret") ?? "";

type Status = "PENDING" | "PUBLISHED" | "REJECTED" | "DRAFT";
type EntityType = "LGA" | "STATE" | "FEDERAL";

interface PressRelease {
  id: string;
  title: string;
  body: string;
  issuingEntity: string;
  entityType: EntityType;
  dateIssued: string;
  status: Status;
  submittedByRole: string | null;
  rejectedReason: string | null;
  attachmentUrl: string | null;
  lga: { lgaName: string; state: string } | null;
}

const STATUS_COLORS: Record<Status, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  REJECTED:  "bg-red-100 text-red-700",
  DRAFT:     "bg-slate-100 text-slate-500",
};

export default function AdminPressReleasesPage() {
  const [releases,    setReleases]    = useState<PressRelease[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter,setStatusFilter]= useState<Status | "">("");
  const [q,           setQ]           = useState("");
  const [dQ,          setDQ]          = useState("");
  const [page,        setPage]        = useState(0);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [acting,      setActing]      = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const PAGE = 25;

  const [form, setForm] = useState({
    title: "", body: "", issuingEntity: "", entityType: "LGA" as EntityType,
    lgaId: "", dateIssued: new Date().toISOString().split("T")[0], attachmentUrl: "",
  });
  const [lgaSearch,  setLgaSearch]  = useState("");
  const [lgaOptions, setLgaOptions] = useState<{ id: string; lgaName: string; state: string }[]>([]);
  const [rejectModal,setRejectModal]= useState<{ id: string } | null>(null);
  const [rejectReason,setRejectReason]= useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDQ(q); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) });
    if (dQ)          params.set("q",      dQ);
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/admin/press-releases?${params}`, { headers: { "x-admin-secret": adminSecret() } });
      const data = await res.json();
      setReleases(data.releases ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load."); }
    finally { setLoading(false); }
  }, [dQ, statusFilter, page]);

  useEffect(() => { fetchReleases(); }, [fetchReleases]);

  useEffect(() => {
    if (lgaSearch.length < 2) { setLgaOptions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/lgas?limit=10&search=${encodeURIComponent(lgaSearch)}&status=APPROVED`, { headers: { "x-admin-secret": adminSecret() } });
      const data = await res.json();
      setLgaOptions(data.lgas ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [lgaSearch]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      await fetch(`/api/admin/press-releases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ action: "publish" }),
      });
      toast.success("Press release published.");
      fetchReleases();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal.id);
    try {
      await fetch(`/api/admin/press-releases/${rejectModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      toast.success("Rejected.");
      setRejectModal(null);
      setRejectReason("");
      fetchReleases();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const deleteRelease = async (id: string) => {
    if (!confirm("Delete this press release permanently?")) return;
    setActing(id);
    try {
      await fetch(`/api/admin/press-releases/${id}`, { method: "DELETE", headers: { "x-admin-secret": adminSecret() } });
      toast.success("Deleted.");
      fetchReleases();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const createRelease = async () => {
    if (!form.title || !form.body || !form.issuingEntity) {
      toast.error("Title, body, and issuing entity are required."); return;
    }
    try {
      const res = await fetch("/api/admin/press-releases", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({
          ...form,
          lgaId: form.lgaId || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Press release published.");
      setShowForm(false);
      setForm({ title: "", body: "", issuingEntity: "", entityType: "LGA", lgaId: "", dateIssued: new Date().toISOString().split("T")[0], attachmentUrl: "" });
      setLgaSearch("");
      fetchReleases();
    } catch { toast.error("Failed."); }
  };

  const pendingCount = releases.filter((r) => r.status === "PENDING").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="h-5 w-5 text-green-600 shrink-0" />
            <h1 className="text-2xl font-bold text-slate-900">Press Releases</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">{pendingCount} pending</span>
            )}
          </div>
          <p className="text-slate-500 text-sm">{total.toLocaleString()} total records</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shrink-0">
          <Plus className="h-4 w-4" /> New Release
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search title or entity…" value={q} onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-green-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["", "PENDING", "PUBLISHED", "REJECTED"] as const).map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                statusFilter === s ? "bg-green-600 text-white border-green-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}>{s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2,3].map((i) => <div key={i} className="h-16 px-6 flex items-center animate-pulse"><div className="h-4 bg-slate-100 rounded w-full" /></div>)}
          </div>
        ) : releases.length === 0 ? (
          <div className="py-20 text-center">
            <Newspaper className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No press releases found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {releases.map((r) => (
              <div key={r.id}>
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      {r.submittedByRole === "LGA_CHAIRMAN" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600">Chairman submission</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {r.issuingEntity} · {new Date(r.dateIssued).toLocaleDateString("en-NG")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status === "PENDING" && (
                      <>
                        <button onClick={() => approve(r.id)} disabled={acting === r.id}
                          className="p-2 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors disabled:opacity-40 text-xs">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setRejectModal({ id: r.id })} disabled={acting === r.id}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {r.status === "PUBLISHED" && (
                      <button onClick={() => approve(r.id)} disabled title="Already published"
                        className="p-2 text-green-500 opacity-40">
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setExpanded((e) => e === r.id ? null : r.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                      {expanded === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteRelease(r.id)} disabled={acting === r.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === r.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50 border-t border-slate-100 px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {r.body}
                      {r.rejectedReason && (
                        <div className="mt-3 px-3 py-2 bg-red-50 rounded-lg text-xs text-red-600">
                          Rejection reason: {r.rejectedReason}
                        </div>
                      )}
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
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm disabled:opacity-40 hover:bg-slate-50">← Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE >= total}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm disabled:opacity-40 hover:bg-slate-50">Next →</button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="font-bold text-slate-900 mb-3">Reject Press Release</h3>
              <textarea rows={3} placeholder="Reason for rejection (optional)…" value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400 resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">Cancel</button>
                <button onClick={reject} disabled={!!acting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60">Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">New Press Release</h3>
                  <p className="text-xs text-slate-500">Will be published immediately</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Headline *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Press release headline…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Issuing Entity *</label>
                    <input type="text" value={form.issuingEntity}
                      onChange={(e) => setForm((f) => ({ ...f, issuingEntity: e.target.value }))}
                      placeholder="e.g. Imo State Government"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Entity Type *</label>
                    <select value={form.entityType} onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value as EntityType }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 bg-white">
                      <option value="LGA">LGA</option>
                      <option value="STATE">State Government</option>
                      <option value="FEDERAL">Federal Government</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Date Issued</label>
                  <input type="date" value={form.dateIssued}
                    onChange={(e) => setForm((f) => ({ ...f, dateIssued: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                {/* LGA link (optional) */}
                {form.entityType === "LGA" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Link to LGA (optional)</label>
                    {form.lgaId ? (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-green-300 bg-green-50">
                        <p className="text-sm text-green-800">{lgaSearch}</p>
                        <button onClick={() => { setForm((f) => ({ ...f, lgaId: "" })); setLgaSearch(""); }}
                          className="text-xs text-slate-400 hover:text-red-500">Clear</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input type="text" placeholder="Search LGA…" value={lgaSearch}
                          onChange={(e) => setLgaSearch(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                        {lgaOptions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-36 overflow-y-auto">
                            {lgaOptions.map((lga) => (
                              <button key={lga.id} onClick={() => { setForm((f) => ({ ...f, lgaId: lga.id })); setLgaSearch(`${lga.lgaName} LGA, ${lga.state}`); setLgaOptions([]); }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 border-b border-slate-50 last:border-0">
                                {lga.lgaName} LGA — {lga.state}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Body *</label>
                  <textarea rows={8} value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Full press release content…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 resize-none leading-relaxed" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Attachment URL (optional)</label>
                  <input type="url" value={form.attachmentUrl}
                    onChange={(e) => setForm((f) => ({ ...f, attachmentUrl: e.target.value }))}
                    placeholder="https://…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">Cancel</button>
                  <button onClick={createRelease}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold">Publish</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

