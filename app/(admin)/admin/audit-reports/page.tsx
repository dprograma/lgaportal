"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, Search, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const ADMIN_SECRET = typeof window !== "undefined" ? (sessionStorage.getItem("adminSecret") ?? "") : "";

interface AuditReport {
  id: string;
  financialYear: number;
  title: string;
  auditingBody: string;
  reportUrl: string;
  isPublished: boolean;
  uploadedBy: string | null;
  createdAt: string;
  lga: { lgaName: string; state: string };
}

export default function AdminAuditReportsPage() {
  const [reports,  setReports]  = useState<AuditReport[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [dSearch,  setDSearch]  = useState("");
  const [page,     setPage]     = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [acting,   setActing]   = useState<string | null>(null);
  const PAGE = 25;

  const [form, setForm] = useState({
    lgaId: "", financialYear: "", title: "", auditingBody: "", reportUrl: "", uploadedBy: "",
  });
  const [lgaSearch,  setLgaSearch]  = useState("");
  const [lgaOptions, setLgaOptions] = useState<{ id: string; lgaName: string; state: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE), ...(dSearch ? { search: dSearch } : {}) });
    try {
      const res = await fetch(`/api/admin/audit-reports?${params}`, { headers: { "x-admin-secret": ADMIN_SECRET } });
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load audit reports."); }
    finally { setLoading(false); }
  }, [dSearch, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    if (lgaSearch.length < 2) { setLgaOptions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/lgas?limit=10&search=${encodeURIComponent(lgaSearch)}&status=APPROVED`, {
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      const data = await res.json();
      setLgaOptions(data.lgas ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [lgaSearch]);

  const submitReport = async () => {
    if (!form.lgaId || !form.financialYear || !form.title || !form.auditingBody || !form.reportUrl) {
      toast.error("All fields except Uploaded By are required."); return;
    }
    try {
      const res = await fetch("/api/admin/audit-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ ...form, financialYear: Number(form.financialYear) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Audit report added.");
      setShowForm(false);
      setForm({ lgaId: "", financialYear: "", title: "", auditingBody: "", reportUrl: "", uploadedBy: "" });
      setLgaSearch("");
      fetchReports();
    } catch { toast.error("Failed to add audit report."); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    setActing(id);
    try {
      await fetch(`/api/admin/audit-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ isPublished: !current }),
      });
      fetchReports();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this audit report record?")) return;
    setActing(id);
    try {
      await fetch(`/api/admin/audit-reports/${id}`, { method: "DELETE", headers: { "x-admin-secret": ADMIN_SECRET } });
      toast.success("Deleted.");
      fetchReports();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-5 w-5 text-green-400" />
            <h1 className="text-2xl font-bold text-white">Audit Reports</h1>
          </div>
          <p className="text-green-200/60 text-sm">{total.toLocaleString()} audit report records</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Add Report
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text" placeholder="Search LGA or report titleâ€¦"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-green-200/40 text-sm focus:outline-none focus:border-green-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2,3].map((i) => <div key={i} className="h-16 px-6 flex items-center animate-pulse"><div className="h-4 bg-slate-100 rounded w-full" /></div>)}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No audit reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <div key={r.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{r.financialYear}</span>
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                    {!r.isPublished && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-600">Hidden</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {r.lga.lgaName} LGA Â· {r.auditingBody}
                    {r.uploadedBy ? ` Â· Uploaded by ${r.uploadedBy}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a href={r.reportUrl} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button onClick={() => togglePublish(r.id, r.isPublished)} disabled={acting === r.id}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-40">
                    {r.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteReport(r.id)} disabled={acting === r.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(total / PAGE) > 1 && (
        <div className="mt-5 flex items-center justify-between text-white">
          <p className="text-sm text-green-200/60">Showing {page * PAGE + 1}â€“{Math.min((page + 1) * PAGE, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-white/20 text-sm disabled:opacity-40 hover:bg-white/10">â† Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE >= total}
              className="px-4 py-2 rounded-xl border border-white/20 text-sm disabled:opacity-40 hover:bg-white/10">Next â†’</button>
          </div>
        </div>
      )}

      {/* Add Report modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Add Audit Report</h3>
                  <p className="text-xs text-slate-500">Report will be publicly visible on the LGA profile</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* LGA selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">LGA *</label>
                  {form.lgaId ? (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-green-300 bg-green-50">
                      <p className="text-sm font-medium text-green-800">{lgaSearch}</p>
                      <button onClick={() => { setForm((f) => ({ ...f, lgaId: "" })); setLgaSearch(""); }}
                        className="text-xs text-slate-400 hover:text-red-500">Change</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="text" placeholder="Search LGA nameâ€¦" value={lgaSearch}
                        onChange={(e) => setLgaSearch(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                      {lgaOptions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-white rounded-xl border border-slate-200 shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {lgaOptions.map((lga) => (
                            <button key={lga.id} onClick={() => { setForm((f) => ({ ...f, lgaId: lga.id })); setLgaOptions([]); setLgaSearch(`${lga.lgaName} LGA, ${lga.state}`); }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 border-b border-slate-50 last:border-0">
                              {lga.lgaName} LGA â€” {lga.state}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Financial Year */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Financial Year *</label>
                  <select value={form.financialYear} onChange={(e) => setForm((f) => ({ ...f, financialYear: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 bg-white">
                    <option value="">Select yearâ€¦</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {[
                  { key: "title",       label: "Report Title *",    placeholder: "e.g. Annual Audit Report 2024" },
                  { key: "auditingBody",label: "Auditing Body *",   placeholder: "e.g. State Auditor General's Office" },
                  { key: "reportUrl",   label: "Report URL *",      placeholder: "https://â€¦" },
                  { key: "uploadedBy",  label: "Uploaded By",       placeholder: "Name of the uploader (optional)" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">{label}</label>
                    <input type="text" placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={submitReport}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold">Add Report</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
