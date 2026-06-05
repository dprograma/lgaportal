"use client";

import { useState } from "react";
import { Flag, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  contentId: string;
  contentType: "post" | "project" | "comment";
}

const REASONS = [
  { value: "MISLEADING",     label: "Misleading information" },
  { value: "INAPPROPRIATE",  label: "Inappropriate content" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "SPAM",           label: "Spam" },
  { value: "OFFENSIVE",      label: "Offensive content" },
  { value: "OTHER",          label: "Other" },
];

export default function ReportButton({ contentId, contentType }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpen() {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  async function handleSubmit() {
    if (!reason) {
      toast.error("Please select a reason.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, contentType, reason, details: details || undefined }),
      });
      if (res.ok) {
        toast.success("Report submitted. Thank you for helping keep this platform safe.");
        setOpen(false);
        setReason("");
        setDetails("");
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to submit report.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Flag className="h-4 w-4 text-red-500" />
                Report Content
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Why are you reporting this content? Your report is anonymous.
            </p>

            {/* Reasons */}
            <div className="space-y-2 mb-4">
              {REASONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 accent-green-700"
                  />
                  <span className={`text-sm transition-colors ${
                    reason === value ? "text-slate-900 font-medium" : "text-slate-600 group-hover:text-slate-800"
                  }`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>

            {/* Details */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Additional details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 200))}
                placeholder="Provide more context…"
                rows={3}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">{details.length}/200</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
