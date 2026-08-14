"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Flag } from "lucide-react";

const CATEGORIES = [
  "Project not started despite allocation",
  "Funds misappropriated",
  "Abandoned project",
  "Incorrect project information",
  "LGA impersonation",
  "Other",
];

export default function ReportPage() {
  const [form, setForm] = useState({ lgaName: "", state: "", category: "", description: "", reporterEmail: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lgaName || !form.category || !form.description) {
      setError("Please fill in all required fields."); return;
    }
    setStatus("loading"); setError("");
    try {
      const res = await fetch("/api/flag-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "LGA",
          entityId:   form.lgaName,
          reason:     `[${form.category}] ${form.description}`,
          reportedBy: form.reporterEmail || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");
      setForm({ lgaName: "", state: "", category: "", description: "", reporterEmail: "" });
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again or email support@774ng.com.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Flag className="h-5 w-5 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Report an Issue</h1>
          </div>
          <p className="text-slate-500 text-sm">Flag misleading LGA data, abandoned projects, or suspected misuse of the platform.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {status === "success" ? (
          <div className="text-center py-16">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Report Submitted</h2>
            <p className="text-slate-500 text-sm mb-6">Thank you. Our moderation team will review your report within 48 hours.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setStatus("idle")} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:border-slate-400 transition-colors">
                Submit Another
              </button>
              <Link href="/" className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <Field label="LGA Name *" hint="Which LGA is this report about?">
              <input
                type="text" value={form.lgaName} onChange={(e) => set("lgaName", e.target.value)}
                placeholder="e.g. Enugu North LGA"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500"
              />
            </Field>

            <Field label="State">
              <input
                type="text" value={form.state} onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. Enugu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500"
              />
            </Field>

            <Field label="Issue Category *">
              <select
                value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Description *" hint="Be as specific as possible — include project names, dates, or amounts where relevant.">
              <textarea
                value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={5} placeholder="Describe the issue in detail…"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 resize-none"
              />
            </Field>

            <Field label="Your Email (optional)" hint="We may contact you for more details. Not shared publicly.">
              <input
                type="email" value={form.reporterEmail} onChange={(e) => set("reporterEmail", e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500"
              />
            </Field>

            <button
              type="submit" disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
            >
              {status === "loading" ? "Submitting…" : "Submit Report"}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              False reports are a violation of our{" "}
              <Link href="/terms" className="underline hover:text-green-700">Terms of Service</Link>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
