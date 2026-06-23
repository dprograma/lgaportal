"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PressRelease {
  id: string;
  title: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED" | "DRAFT";
  dateIssued: string;
  rejectedReason: string | null;
  createdAt: string;
}

const STATUS_META = {
  PENDING:   { label: "Pending Review", icon: Clock,        color: "text-amber-600 bg-amber-50 border-amber-200"   },
  PUBLISHED: { label: "Published",      icon: CheckCircle2, color: "text-green-700 bg-green-50 border-green-200"   },
  REJECTED:  { label: "Rejected",       icon: XCircle,      color: "text-red-600 bg-red-50 border-red-200"         },
  DRAFT:     { label: "Draft",          icon: AlertCircle,  color: "text-slate-500 bg-slate-50 border-slate-200"   },
};

export default function LgaPressReleasesPage() {
  const lgaId = typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : "";

  const [releases,  setReleases]  = useState<PressRelease[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [submitting,setSubmitting]= useState(false);

  const [form, setForm] = useState({ title: "", body: "", dateIssued: "", attachmentUrl: "" });

  const fetchReleases = useCallback(async () => {
    if (!lgaId) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/lga-dashboard/press-releases", { headers: { "x-lga-id": lgaId } });
      const data = await res.json();
      setReleases(data.releases ?? []);
    } catch { toast.error("Failed to load press releases."); }
    finally { setLoading(false); }
  }, [lgaId]);

  useEffect(() => { fetchReleases(); }, [fetchReleases]);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required."); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/lga-dashboard/press-releases", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Press release submitted for admin review.");
      setShowForm(false);
      setForm({ title: "", body: "", dateIssued: "", attachmentUrl: "" });
      fetchReleases();
    } catch { toast.error("Submission failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="h-5 w-5 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">Press Releases</h1>
          </div>
          <p className="text-slate-500 text-sm">Submit press releases on behalf of your LGA. Each submission is reviewed by admin before publication.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold">
          <Plus className="h-4 w-4" /> New Release
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : releases.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Newspaper className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No press releases yet</p>
          <p className="text-sm text-slate-400 mt-1">Submit your first press release using the button above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((r) => {
            const meta = STATUS_META[r.status];
            const Icon = meta.icon;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm mb-1.5">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.dateIssued).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}Submitted {new Date(r.createdAt).toLocaleDateString("en-NG")}
                    </p>
                    {r.status === "REJECTED" && r.rejectedReason && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        Reason: {r.rejectedReason}
                      </p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold shrink-0 ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" /> {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">New Press Release</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Will be submitted for admin approval before publishing</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Headline *</label>
                  <input type="text" placeholder="Press release headline…" value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Date Issued *</label>
                  <input type="date" value={form.dateIssued}
                    onChange={(e) => setForm((f) => ({ ...f, dateIssued: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Body *</label>
                  <textarea rows={10} placeholder="Write the full text of your press release here…"
                    value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 resize-none leading-relaxed" />
                  <p className="text-[10px] text-slate-400 mt-1">{form.body.length} characters</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Attachment URL (optional)</label>
                  <input type="url" placeholder="https://… (link to attached document)" value={form.attachmentUrl}
                    onChange={(e) => setForm((f) => ({ ...f, attachmentUrl: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={submit} disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:opacity-60">
                    {submitting ? "Submitting…" : "Submit for Review"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
