"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-widest mb-4">
            <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Got Questions? We Have Answers.</h1>
          <p className="text-slate-500">Everything you need to know about 774ng.com.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <FAQGroup heading="General">
          <FAQ q="What is 774ng.com?">
            774ng.com is Nigeria&apos;s digital platform for local government transparency and investment. It connects LGA administrators, citizens, and investors on one platform — enabling LGAs to showcase endowments, publish projects, and attract capital, while citizens track what their government is doing.
          </FAQ>
          <FAQ q="Is the platform free to use?">
            Yes — for citizens, browsing and engaging with the platform is completely free. LGA administrators have a free trial period; ongoing management features require a subscription. Investor registration is free.
          </FAQ>
          <FAQ q="Who built this platform?">
            774ng.com was built by a team of Nigerians committed to good governance and grassroots development. We are privately operated and not affiliated with any government agency.
          </FAQ>
        </FAQGroup>

        <FAQGroup heading="For Citizens">
          <FAQ q="How do I find my LGA?">
            Use the search bar on the homepage or go to <Link href="/lgas" className="text-green-700 underline">/lgas</Link> and filter by state. You can search by LGA name directly.
          </FAQ>
          <FAQ q="Can I report a problem with my LGA?">
            Yes. Go to <Link href="/report" className="text-green-700 underline">Report an Issue</Link> and submit a report. Your report is reviewed by our moderation team and, where appropriate, flagged to the LGA administration.
          </FAQ>
          <FAQ q="How do I know the data on the platform is accurate?">
            LGA administrators publish data themselves and agree to our Terms of Service, which prohibits false information. Citizens can flag inaccuracies using the report tool. We also cross-reference key data points during the LGA verification process.
          </FAQ>
        </FAQGroup>

        <FAQGroup heading="For LGA Administrators">
          <FAQ q="How does an LGA register on the platform?">
            The LGA chairman (or a designated official) signs up at <Link href="/lga-signup" className="text-green-700 underline">/lga-signup</Link> using their official contact details. After email verification and OTP login, the account is submitted for admin review and verification.
          </FAQ>
          <FAQ q="How long does verification take?">
            Typically 2–5 business days after all required documents are submitted. You will receive an email notification once your LGA is approved or if further documents are needed.
          </FAQ>
          <FAQ q="What happens when an LGA chairman&apos;s tenure ends?">
            The platform tracks tenure dates. When a tenure expires, the system enters a grace period during which the outgoing chairman can export data. A new chairman can then register and claim the LGA profile through the succession process.
          </FAQ>
          <FAQ q="Can multiple staff members access the dashboard?">
            Yes. The LGA chairman can add staff members through the Staff Management section of the dashboard, with controlled access levels.
          </FAQ>
        </FAQGroup>

        <FAQGroup heading="For Investors">
          <FAQ q="How do I find investment opportunities?">
            Go to <Link href="/invest" className="text-green-700 underline">Explore Opportunities</Link> to browse LGA endowments filtered by resource category (agriculture, minerals, energy, etc.) and state.
          </FAQ>
          <FAQ q="Does 774ng.com broker investments?">
            No. We facilitate connections between investors and LGA administrations. Negotiations, agreements, and transactions happen directly between both parties. We are not a financial intermediary.
          </FAQ>
          <FAQ q="How do I contact an LGA I&apos;m interested in?">
            On any endowment or LGA profile page, click &ldquo;Submit Inquiry.&rdquo; The LGA chairman receives your inquiry in their dashboard and responds directly.
          </FAQ>
        </FAQGroup>

        <FAQGroup heading="Privacy & Data">
          <FAQ q="What data do you collect about me?">
            We collect registration data (name, email, state/LGA), content you publish, and anonymised usage analytics. See our <Link href="/privacy" className="text-green-700 underline">Privacy Policy</Link> for full details.
          </FAQ>
          <FAQ q="Can I delete my account?">
            Yes. Go to Settings &gt; Account &gt; Delete Account. Your personal data will be removed within 30 days.
          </FAQ>
        </FAQGroup>

        <div className="text-center pt-4">
          <p className="text-slate-500 text-sm mb-4">Still can&apos;t find your answer?</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-all">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

function FAQGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-4 pl-1">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-green-300 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="font-semibold text-slate-800 text-sm leading-snug">{q}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
