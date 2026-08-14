"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  "False or misleading project data",
  "Fake allocation figures",
  "Impersonation of a government official",
  "Offensive or inappropriate content",
  "Harassment or abuse",
  "Spam or scam activity",
  "Copyright infringement",
  "Other",
];

export default function ReportPage() {
  const [form, setForm] = useState({ category: "", description: "", url: "", name: "", email: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.description) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: `[${form.category}] ${form.description}`,
          pageUrl: form.url || undefined,
          reporterName: form.name || undefined,
          reporterEmail: form.email || undefined,
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Report an Issue</h1>
          </div>
          <p className="text-sm text-slate-500">
            Help us keep the platform accurate and safe. All reports are reviewed by our moderation team.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {status === "done" ? (
          <div className="bg-white border border-green-200 rounded-2xl p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Report Submitted</h2>
            <p className="text-slate-500 mb-6">Thank you. Our team will review your report and take appropriate action.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-all">
              Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            {status === "error" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                Something went wrong. Please try again or email <a href="mailto:support@774ng.com" className="underline">support@774ng.com</a>.
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Category <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors"
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Page URL or LGA Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="e.g. /lgas/udi-lga or 'Udi LGA'"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description <span className="text-red-500">*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={5}
                placeholder="Please describe the issue clearly. Include specific details that will help our team investigate."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Anonymous if left blank"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Email <span className="text-slate-400 font-normal">(for follow-up)</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="we'll only contact you if needed"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "sending" || !form.category || !form.description}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                {status === "sending" ? (
                  <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Submitting…</>
                ) : (
                  <><AlertTriangle className="h-4 w-4" /> Submit Report</>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Reports are reviewed within 2 business days. Malicious or false reports may result in account action.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
