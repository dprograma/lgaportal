"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, CheckCircle2, AlertCircle } from "lucide-react";

const REASONS = [
  { value: "INAPPROPRIATE", label: "Inappropriate Content" },
  { value: "MISINFORMATION", label: "Misinformation / False Claims" },
  { value: "SPAM",           label: "Spam or Repetitive" },
  { value: "OFFENSIVE",      label: "Offensive or Hateful" },
  { value: "OTHER",          label: "Other" },
] as const;

interface Props {
  open:    boolean;
  postId:  string;
  onClose: () => void;
}

export default function FlagModal({ open, postId, onClose }: Props) {
  const [reason,  setReason]  = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  async function submit() {
    if (!reason) { setError("Please select a reason."); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/flag", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId, reason, details: details || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setReason(""); setDetails(""); setError(""); setDone(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center">
                    <Flag className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="font-bold text-slate-900">Report Post</span>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="px-6 py-5">
                {done ? (
                  <div className="text-center py-6">
                    <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="h-7 w-7 text-green-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1.5">Report submitted</h4>
                    <p className="text-sm text-slate-500">
                      Thank you for keeping the platform safe. Our admin team will review this report shortly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      Help us keep the platform credible. Select the reason this post violates our community standards.
                    </p>

                    {/* Reason */}
                    <div className="space-y-2">
                      {REASONS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setReason(value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                            reason === value
                              ? "border-red-400 bg-red-50 text-red-700 font-medium"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            reason === value ? "border-red-500" : "border-slate-300"
                          }`}>
                            {reason === value && <span className="h-2 w-2 rounded-full bg-red-500" />}
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Optional details */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Additional details <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        maxLength={500}
                        placeholder="Provide any additional context…"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none"
                      />
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 pb-5 flex gap-3">
                {done ? (
                  <button onClick={handleClose} className="w-full py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
                    Done
                  </button>
                ) : (
                  <>
                    <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={submit}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      {loading ? (
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          <Flag className="h-3.5 w-3.5" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
