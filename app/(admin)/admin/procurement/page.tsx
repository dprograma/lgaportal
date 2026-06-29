"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const adminSecret = () => sessionStorage.getItem("adminSecret") ?? "";

interface Contract {
  id: string;
  title: string;
  contractor: string;
  value: string;
  awardDate: string;
  scope: string;
  source: string | null;
  isPublished: boolean;
  lga: { lgaName: string; state: string };
}

function naira(koboStr: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
    .format(Number(BigInt(koboStr)) / 100);
}

export default function AdminProcurementPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [dSearch,   setDSearch]   = useState("");
  const [page,      setPage]      = useState(0);
  const [showForm,  setShowForm]  = useState(false);
  const [acting,    setActing]    = useState<string | null>(null);
  const PAGE = 25;

  // Form state
  const [form, setForm] = useState({
    lgaId: "", title: "", contractor: "", value: "", awardDate: "", scope: "",
  });
  const [lgaSearch,    setLgaSearch]    = useState("");
  const [lgaOptions,   setLgaOptions]   = useState<{ id: string; lgaName: string; state: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE), ...(dSearch ? { search: dSearch } : {}) });
    try {
      const res = await fetch(`/api/admin/procurement?${params}`, { headers: { "x-admin-secret": adminSecret() } });
      const data = await res.json();
      setContracts(data.contracts ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load contracts."); }
    finally { setLoading(false); }
  }, [dSearch, page]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  // LGA typeahead
  useEffect(() => {
    if (lgaSearch.length < 2) { setLgaOptions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/lgas?limit=10&search=${encodeURIComponent(lgaSearch)}&status=APPROVED`, {
        headers: { "x-admin-secret": adminSecret() },
      });
      const data = await res.json();
      setLgaOptions(data.lgas ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [lgaSearch]);

  const submitContract = async () => {
    if (!form.lgaId || !form.title || !form.contractor || !form.value || !form.awardDate || !form.scope) {
      toast.error("All fields are required."); return;
    }
    // convert naira to kobo
    const kobo = Math.round(Number(form.value.replace(/,/g, "")) * 100);
    try {
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ ...form, value: kobo }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Contract added.");
      setShowForm(false);
      setForm({ lgaId: "", title: "", contractor: "", value: "", awardDate: "", scope: "" });
      fetchContracts();
    } catch { toast.error("Failed to add contract."); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    setActing(id);
    try {
      await fetch(`/api/admin/procurement/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ isPublished: !current }),
      });
      fetchContracts();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const deleteContract = async (id: string) => {
    if (!confirm("Delete this contract record?")) return;
    setActing(id);
    try {
      await fetch(`/api/admin/procurement/${id}`, { method: "DELETE", headers: { "x-admin-secret": adminSecret() } });
      toast.success("Deleted.");
      fetchContracts();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-green-400" />
            <h1 className="text-2xl font-bold text-white">Procurement Contracts</h1>
          </div>
          <p className="text-green-200/60 text-sm">{total.toLocaleString()} contract records</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Add Contract
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text" placeholder="Search title or contractorâ€¦"
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
        ) : contracts.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No contracts found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                    {!c.isPublished && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">Hidden</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {c.lga.lgaName} LGA Â· {c.contractor} Â· {naira(c.value)} Â· {new Date(c.awardDate).toLocaleDateString("en-NG")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.scope}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => togglePublish(c.id, c.isPublished)} disabled={acting === c.id}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-40">
                    {c.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteContract(c.id)} disabled={acting === c.id}
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

      {/* Add Contract modal */}
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
                  <FileText className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Add Procurement Contract</h3>
                  <p className="text-xs text-slate-500">Contract details will be publicly visible on the LGA profile</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* LGA selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">LGA *</label>
                  {form.lgaId ? (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-green-300 bg-green-50">
                      <p className="text-sm font-medium text-green-800">LGA selected</p>
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

                {[
                  { key: "title",      label: "Contract Title *",  placeholder: "e.g. Construction of Ward 3 Road" },
                  { key: "contractor", label: "Contractor Name *", placeholder: "e.g. ABC Construction Ltd" },
                  { key: "value",      label: "Contract Value (â‚¦) *", placeholder: "e.g. 15000000" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">{label}</label>
                    <input type="text" placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Award Date *</label>
                  <input type="date" value={form.awardDate}
                    onChange={(e) => setForm((f) => ({ ...f, awardDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Project Scope *</label>
                  <textarea rows={3} placeholder="Describe the scope of workâ€¦"
                    value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={submitContract}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold">Add Contract</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

