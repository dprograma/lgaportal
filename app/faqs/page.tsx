"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";

const faqs: { q: string; a: string; cat: string }[] = [
  // General
  { cat: "General", q: "What is 774ng.com?",                    a: "774ng.com is Nigeria's open platform for local government transparency and investment facilitation. It connects LGA administrations with citizens and investors across all 774 LGAs in Nigeria." },
  { cat: "General", q: "Is this an official government website?", a: "No. 774ng.com is an independent platform. It is not affiliated with or operated by any Nigerian government body at federal, state, or local level. LGA data displayed is provided by verified LGA administrators." },
  { cat: "General", q: "Is it free to use?",                    a: "Citizens can access and use the platform entirely for free. LGA administrators may access premium features (analytics, multiple staff accounts, priority listing) through a subscription. Investor accounts are free to create." },

  // Citizens
  { cat: "Citizens", q: "How do I find my LGA?",                 a: "Use the search bar on the homepage or go to the Explore LGAs section. You can search by LGA name or filter by state. Each LGA has its own profile page with projects, allocations, endowments, and press releases." },
  { cat: "Citizens", q: "How do I report an issue in my LGA?",   a: "Go to the Report page, select the relevant LGA, describe the issue, and submit. The platform notifies the LGA administrator, and you can track the status of your report." },
  { cat: "Citizens", q: "Can I submit feedback on a project?",   a: "Yes. On any published project page you will find a feedback section. You must be logged in as a citizen to submit feedback. Your name and LGA are shown to the LGA administrator; your email is never shared." },

  // LGAs
  { cat: "LGAs", q: "Who can register an LGA account?",         a: "Only the sitting LGA chairman or an officially designated representative. During registration you must provide verifiable official contact details. Our admin team reviews all LGA applications within 48 hours." },
  { cat: "LGAs", q: "How long does LGA verification take?",     a: "Typically 24–48 business hours from submission. You will receive an email notification once your account is approved or if additional information is required." },
  { cat: "LGAs", q: "Can I add staff to my LGA dashboard?",     a: "Yes. The chairman account can invite staff members under Staff Management in the LGA dashboard. Staff can be given limited roles (e.g. press releases only) or full admin access." },
  { cat: "LGAs", q: "What is the free tier for LGAs?",          a: "LGAs on the free tier can publish up to 5 projects, 3 endowments, and 5 press releases. Analytics and investor inquiry management require a paid subscription." },

  // Investors
  { cat: "Investors", q: "How do I contact an LGA about an investment opportunity?", a: "Click 'Register as Investor', complete your profile, then browse endowments and click 'Submit Inquiry' on any listing. The LGA chairman receives your inquiry immediately." },
  { cat: "Investors", q: "Does the platform broker investment deals?",                a: "No. 774ng.com facilitates the introduction between investors and LGAs. All negotiations, agreements, and financial arrangements happen directly between you and the LGA administration. We have no role in the transaction itself." },
  { cat: "Investors", q: "Are investment opportunities on the platform verified?",   a: "Endowment listings are published by verified LGA administrations. We verify the LGA account but do not independently audit the endowment claims. Investors should perform their own due diligence." },

  // Data & Privacy
  { cat: "Privacy", q: "What data do you collect?",              a: "We collect account registration data (name, email, state/LGA), content you publish, and anonymised usage analytics. We do not sell your data. See our Privacy Policy for full details." },
  { cat: "Privacy", q: "How do I delete my account?",            a: "Go to Settings → Account → Delete Account. Your data will be permanently deleted within 30 days. Payment records may be retained for 7 years as required by Nigerian financial law." },
  { cat: "Privacy", q: "Who can see my feedback submissions?",   a: "Your name and LGA are visible to the relevant LGA administrator. Your email and phone number are never shared publicly or with LGA staff." },
];

const categories = Array.from(new Set(faqs.map((f) => f.cat)));

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-900">{q}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 text-sm text-slate-600 leading-relaxed bg-slate-50 border-t border-slate-100">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqsPage() {
  const [active, setActive] = useState("All");
  const visible = active === "All" ? faqs : faqs.filter((f) => f.cat === active);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h1>
          </div>
          <p className="text-slate-500 text-sm">Can&apos;t find your answer? <Link href="/support" className="text-green-700 underline">Contact support →</Link></p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active === cat
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visible.map((f) => <Item key={f.q} q={f.q} a={f.a} />)}
        </div>

        <div className="mt-10 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
          <p className="text-sm font-semibold text-slate-900 mb-1">Still have questions?</p>
          <p className="text-xs text-slate-500 mb-4">Our support team usually responds within 24 hours.</p>
          <Link href="/support" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
            Contact Support
          </Link>
        </div>

        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/about"        className="hover:text-green-700 transition-colors">About Us</Link>
          <Link href="/how-it-works" className="hover:text-green-700 transition-colors">How It Works</Link>
          <Link href="/terms"        className="hover:text-green-700 transition-colors">Terms of Service</Link>
          <Link href="/"             className="hover:text-green-700 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
