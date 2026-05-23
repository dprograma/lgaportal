"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, CheckCircle2, AlertCircle, MessageCircleMore } from "lucide-react";

const CATEGORIES = [
  "Service Delivery",
  "Infrastructure",
  "Governance & Transparency",
  "Community Development",
  "Health & Education",
  "Other",
];

interface Props {
  open:    boolean;
  postId:  string;
  onClose: () => void;
}

export default function FeedbackModal({ open, postId, onClose }: Props) {
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [category, setCategory] = useState("");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  async function submit() {
    if (!rating)   { setError("Please select a rating."); return; }
    if (!category) { setError("Please select a category."); return; }
    if (message.trim().length < 10) { setError("Feedback must be at least 10 characters."); return; }

    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId, rating, category, message }),
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
    setRating(0); setHovered(0); setCategory(""); setMessage(""); setError(""); setDone(false);
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
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-green-100 flex items-center justify-center">
                    <MessageCircleMore className="h-4 w-4 text-green-700" />
                  </div>
                  <span className="font-bold text-slate-900">Submit Feedback</span>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="px-6 py-5 overflow-y-auto flex-1">
                {done ? (
                  <div className="text-center py-8">
                    <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="h-7 w-7 text-green-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1.5">Thank you for your feedback!</h4>
                    <p className="text-sm text-slate-500">Your input helps improve governance and service delivery in this LGA.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Star rating */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Overall Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setRating(star)}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-7 w-7 transition-colors ${
                                star <= (hovered || rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-slate-200"
                              }`}
                            />
                          </button>
                        ))}
                        {rating > 0 && (
                          <span className="ml-2 text-sm text-slate-500 self-center">
                            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Feedback Category <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              category === cat
                                ? "bg-green-700 text-white border-green-700"
                                : "border-slate-200 text-slate-600 hover:border-green-400"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Feedback <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={1000}
                        placeholder="Share your detailed feedback on this post or the LGA's performance…"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 resize-none"
                      />
                      <p className="text-right text-xs text-slate-400 mt-1">{message.length}/1000</p>
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

              {!done && (
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                  <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : "Submit Feedback"}
                  </button>
                </div>
              )}
              {done && (
                <div className="px-6 py-4 border-t border-slate-100">
                  <button onClick={handleClose} className="w-full py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
