"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, ShieldOff,
  UploadCloud, FileText, X, ChevronDown, RefreshCw,
  BadgeCheck, History,
} from "lucide-react";
import { toast } from "sonner";

function getLgaId(): string {
  return typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : "";
}

interface TenureRecord {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface TenureData {
  tenureStartDate:  string | null;
  tenureEndDate:    string | null;
  tenureStatus:     string;
  gracePeriodEndsAt: string | null;
  freeUntil:        string | null;
  history:          TenureRecord[];
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    ACTIVE:       "bg-green-100 text-green-700",
    TENURE_ENDED: "bg-amber-100 text-amber-700",
    SUSPENDED:    "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function TenurePage() {
  const [data,       setData]       = useState<TenureData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  // Re-election form state
  const [newEndDate,   setNewEndDate]   = useState("");
  const [certBase64,   setCertBase64]   = useState<string | null>(null);
  const [certName,     setCertName]     = useState("");
  const [certMime,     setCertMime]     = useState("");
  const [notes,        setNotes]        = useState("");

  const lgaId = getLgaId();

  const fetchTenure = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/lga-dashboard/tenure/reelection", {
        headers: { "x-lga-id": lgaId },
      });
      const json = await res.json();
      // API returns { lga: { tenureStartDate, tenureEndDate, ... }, tenures: [...] }
      if (json.lga) {
        setData({
          tenureStartDate:   json.lga.tenureStartDate,
          tenureEndDate:     json.lga.tenureEndDate,
          tenureStatus:      json.lga.tenureStatus ?? "ACTIVE",
          gracePeriodEndsAt: json.lga.gracePeriodEndsAt,
          freeUntil:         json.lga.freeUntil,
          history:           json.tenures ?? [],
        });
      }
    } catch {
      toast.error("Failed to load tenure data.");
    } finally {
      setLoading(false);
    }
  }, [lgaId]);

  useEffect(() => { fetchTenure(); }, [fetchTenure]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5 MB."); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, JPG, or PNG allowed."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // Strip "data:mime;base64," prefix
      setCertBase64(result.split(",")[1]);
      setCertMime(file.type);
      setCertName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submitReelection = async () => {
    if (!newEndDate) { toast.error("Please select the new term end date."); return; }
    if (!certBase64)  { toast.error("Please upload your Certificate of Election."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/lga-dashboard/tenure/reelection", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
        body: JSON.stringify({
          newEndDate,
          fileData:  certBase64,
          fileName:  certName,
          mimeType:  certMime,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Submission failed."); return; }
      toast.success("Re-election submitted. Tenure renewed!");
      setShowModal(false);
      setCertBase64(null);
      setCertName("");
      setNewEndDate("");
      setNotes("");
      fetchTenure();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const status      = data?.tenureStatus ?? "ACTIVE";
  const endDate     = data?.tenureEndDate ?? null;
  const graceEnd    = data?.gracePeriodEndsAt ?? null;
  const freeUntil   = data?.freeUntil ?? null;
  const daysLeft    = endDate ? daysUntil(endDate) : null;
  const graceDays   = graceEnd ? daysUntil(graceEnd) : null;
  const freeDays    = freeUntil ? daysUntil(freeUntil) : null;
  const history     = data?.history ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenure Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your chairmanship term and submit re-election documents</p>
        </div>
        {status !== "SUSPENDED" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Submit Re-election
          </button>
        )}
      </div>

      {/* Status banner */}
      {status === "SUSPENDED" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ShieldOff className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Account Suspended</p>
            <p className="text-sm text-red-700 mt-0.5">
              Your LGA account has been suspended due to tenure expiry. Contact{" "}
              <a href="mailto:support@lgaportal.ng" className="underline">support@lgaportal.ng</a> to restore access.
            </p>
          </div>
        </div>
      )}

      {status === "TENURE_ENDED" && graceDays !== null && graceDays > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Tenure Ended — Grace Period Active</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your tenure has ended. You have <strong>{graceDays} day{graceDays !== 1 ? "s" : ""}</strong> left in your grace period
              to submit re-election documents before your account is suspended.
            </p>
          </div>
        </div>
      )}

      {/* Current tenure card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-green-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">Current Tenure</h2>
            <p className="text-xs text-slate-400">Your active chairmanship term</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</p>
            <p className="text-sm font-semibold text-slate-900">
              {data?.tenureStartDate ? new Date(data.tenureStartDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "Not set"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</p>
            <p className="text-sm font-semibold text-slate-900">
              {endDate ? new Date(endDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "Not set"}
            </p>
          </div>
          <div className={`rounded-xl p-4 ${
            daysLeft === null ? "bg-slate-50" :
            daysLeft <= 0 ? "bg-red-50" :
            daysLeft <= 30 ? "bg-amber-50" : "bg-green-50"
          }`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Days Remaining</p>
            <p className={`text-2xl font-extrabold ${
              daysLeft === null ? "text-slate-400" :
              daysLeft <= 0 ? "text-red-700" :
              daysLeft <= 30 ? "text-amber-700" : "text-green-700"
            }`}>
              {daysLeft === null ? "—" : daysLeft <= 0 ? "Expired" : daysLeft}
            </p>
          </div>
        </div>
      </div>

      {/* Free trial card */}
      {freeDays !== null && (
        <div className={`rounded-2xl border p-5 mb-5 ${
          freeDays <= 0 ? "bg-red-50 border-red-200" :
          freeDays <= 7 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`h-5 w-5 shrink-0 ${
              freeDays <= 0 ? "text-red-600" :
              freeDays <= 7 ? "text-amber-600" : "text-blue-600"
            }`} />
            <div>
              <p className={`text-sm font-bold ${
                freeDays <= 0 ? "text-red-800" :
                freeDays <= 7 ? "text-amber-800" : "text-blue-800"
              }`}>
                {freeDays <= 0 ? "Free Trial Expired" :
                 `Free Trial: ${freeDays} day${freeDays !== 1 ? "s" : ""} remaining`}
              </p>
              <p className={`text-xs mt-0.5 ${
                freeDays <= 0 ? "text-red-600" :
                freeDays <= 7 ? "text-amber-600" : "text-blue-600"
              }`}>
                {freeDays <= 0
                  ? "Your free trial has ended. Please subscribe to continue."
                  : `Trial ends ${new Date(freeUntil!).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Policy reminder */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm text-slate-700">
        <p className="font-semibold mb-1 flex items-center gap-1.5">
          <BadgeCheck className="h-4 w-4 text-green-600" />
          Tenure Renewal Policy
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-500">
          <li>Upload your Certificate of Return / Election when you are re-elected</li>
          <li>You have a 7-day grace period after tenure expiry to submit renewal</li>
          <li>All staff publish rights are revoked if tenure lapses without renewal</li>
          <li>Admin reviews re-election certificates within 3–5 business days</li>
        </ul>
      </div>

      {/* Tenure history */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <History className="h-4 w-4 text-slate-400" />
          <h2 className="font-bold text-slate-900 text-sm">Tenure History</h2>
        </div>

        {history.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">No tenure records yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((rec) => (
              <div key={rec.id}>
                <button
                  onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    rec.status === "ACTIVE" ? "bg-green-500" :
                    rec.status === "EXPIRED" ? "bg-slate-400" : "bg-red-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(rec.startDate).getFullYear()} – {new Date(rec.endDate).getFullYear()} Term
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(rec.startDate).toLocaleDateString()} → {new Date(rec.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    rec.status === "ACTIVE"  ? "bg-green-100 text-green-700" :
                    rec.status === "EXPIRED" ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-600"
                  }`}>
                    {rec.status}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded === rec.id ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {expanded === rec.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-1 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                        <p><span className="font-medium">Start:</span> {new Date(rec.startDate).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                        <p><span className="font-medium">End:</span>   {new Date(rec.endDate).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                        <p><span className="font-medium">Recorded:</span> {new Date(rec.createdAt).toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Re-election modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900">Submit Re-election Notice</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Upload your Certificate of Return</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* New end date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    New Term End Date
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100"
                  />
                </div>

                {/* Certificate upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Certificate of Return / Election
                  </label>
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
                    certBase64 ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-green-400 hover:bg-slate-50"
                  }`}>
                    {certBase64 ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <p className="text-sm font-medium text-green-700">{certName}</p>
                        <p className="text-xs text-green-500">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">Click to upload certificate</p>
                        <p className="text-xs text-slate-400">PDF, JPG, or PNG — max 5 MB</p>
                      </>
                    )}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFileChange} />
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Certificate issued by INEC Kano State on 15 March 2026..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReelection}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    <FileText className="h-3.5 w-3.5" />
                    Submit Renewal
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
