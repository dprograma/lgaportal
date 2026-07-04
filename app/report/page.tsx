"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, AlertTriangle, CheckCircle2, AlertCircle, Send } from "lucide-react";

const CATEGORIES = [
  "Missing or incorrect project data",
  "Unverified allocation figures",
  "Suspected fake LGA profile",
  "Offensive or inappropriate content",
  "Corruption or financial misconduct",
  "Technical bug on the platform",
  "Other",
];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

export default function ReportPage() {
  const [form, setForm]       = useState({ name: "", email: "", state: "", lgaName: "", category: "", description: "", evidence: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.description || form.description.length < 20) {
      setError("Please select a category and provide a description of at least 20 characters.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.name || "Anonymous",
          email:    form.email || "noreply@774ng.com",
          subject:  "Issue Report",
          message:  `Category: ${form.category}\nState: ${form.state}\nLGA: ${form.lgaName}\n\n${form.description}${form.evidence ? `\n\nEvidence/Links: ${form.evidence}` : ""}`,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email support@774ng.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center max-w-md w-full">
          <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Report submitted</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Thank you. Our moderation team will review your report and take appropriate action within 5 business days.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/" className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold text-center transition-colors">
              Back to Home
            </Link>
            <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", state: "", lgaName: "", category: "", description: "", evidence: "" }); }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
              Submit another report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium">Report an Issue</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Report an Issue</h1>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Spotted incorrect data, suspicious activity, or a platform problem? Let us know.
            All reports are reviewed by our moderation team. You may submit anonymously.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Issue Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* State + LGA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">State (if applicable)</label>
              <select
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors"
              >
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">LGA Name (if applicable)</label>
              <input
                type="text"
                placeholder="e.g. Aba North"
                value={form.lgaName}
                onChange={(e) => set("lgaName", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Describe the issue clearly. What did you observe? What do you believe is incorrect or problematic?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Evidence / Links (optional)</label>
            <input
              type="text"
              placeholder="URL to the page, document, or reference…"
              value={form.evidence}
              onChange={(e) => set("evidence", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 mb-4">
              Your identity is optional. If you&apos;d like a follow-up, provide your name and email.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 transition-colors"
              />
              <input
                type="email"
                placeholder="Your email (optional)"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {submitting ? (
              <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Submitting…</>
            ) : (
              <><Send className="h-4 w-4" /> Submit Report</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
