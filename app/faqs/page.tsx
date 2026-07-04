"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, HelpCircle, Search } from "lucide-react";

const faqGroups = [
  {
    group: "General",
    faqs: [
      {
        q: "What is 774ng.com?",
        a: "774ng.com is Nigeria's open platform for Local Government Area (LGA) transparency, investment facilitation, and citizen accountability. It covers all 774 LGAs across Nigeria's 36 states and the FCT.",
      },
      {
        q: "Is 774ng.com affiliated with the Nigerian government?",
        a: "No. 774ng.com is an independent platform. We work with LGA administrations and publish publicly available data, but we are not a government agency or government-owned entity.",
      },
      {
        q: "Is the platform free to use?",
        a: "Yes — citizens can browse LGA profiles, projects, allocations, and endowments completely free. LGA administrators have a free tier with core features, and optional paid plans for advanced features.",
      },
    ],
  },
  {
    group: "For Citizens",
    faqs: [
      {
        q: "How do I create a citizen account?",
        a: "Click 'Join Free' on the homepage or go to /signup. You'll need a valid email address. No credit card is required.",
      },
      {
        q: "How do I find my LGA?",
        a: "Use the search bar on the homepage or visit /lgas and filter by state. You can search by LGA name or browse by state.",
      },
      {
        q: "How do I report an issue with my LGA?",
        a: "Go to /report, fill in the report form, and select the relevant LGA and issue category. LGA administrators and our moderation team will review the report.",
      },
      {
        q: "Can I see how much federal allocation my LGA received?",
        a: "Yes — verified LGAs can publish their allocation data. Visit the LGA's profile and click 'Allocation History', or browse /allocations for platform-wide data.",
      },
      {
        q: "Are the project completion figures verified?",
        a: "Project data is submitted by LGA administrators. Citizens can flag projects they believe are inaccurate using the report button. Our moderation team investigates flagged content.",
      },
    ],
  },
  {
    group: "For LGAs",
    faqs: [
      {
        q: "How does an LGA register on the platform?",
        a: "The LGA chairman or a designated staff member visits /lga-signup, submits the registration form, and uploads required documents. Admin verification takes 3–5 business days.",
      },
      {
        q: "What documents are required for LGA verification?",
        a: "Typically: proof of chairmanship/appointment, a government-issued ID, and an official LGA letterhead. Full requirements are shown during the registration flow.",
      },
      {
        q: "Can an LGA publish projects before being verified?",
        a: "LGAs can create draft projects, but projects will not be publicly visible until the LGA account is verified and the project is approved by our admin team.",
      },
      {
        q: "How do endowments help attract investors?",
        a: "Endowments appear on the platform's investment directory (/invest) and are matched with investor inquiries. The more detail you add — highlights, investment range, description — the more inquiries you'll receive.",
      },
      {
        q: "What happens if an LGA's data is flagged by a citizen?",
        a: "Our moderation team will review the flag and contact the LGA administrator for clarification. If the data is found to be inaccurate, it will be corrected or removed.",
      },
    ],
  },
  {
    group: "For Investors",
    faqs: [
      {
        q: "How do I register as an investor?",
        a: "Visit /invest and click 'Register as Investor'. Fill in your profile including sector interests and investment appetite.",
      },
      {
        q: "Does 774ng.com broker or guarantee investment returns?",
        a: "No. We facilitate introductions between investors and LGA administrations. All due diligence, negotiations, and investment decisions are strictly between you and the LGA.",
      },
      {
        q: "How do I contact an LGA directly?",
        a: "Submit an investor inquiry through the LGA's endowment or profile page. The LGA administrator will be notified and can respond through the platform.",
      },
    ],
  },
  {
    group: "Privacy & Data",
    faqs: [
      {
        q: "How is my personal data protected?",
        a: "All data is encrypted in transit. Passwords are hashed with bcrypt. Login is protected by OTP email verification. We comply with the Nigeria Data Protection Act 2023 (NDPA). See our Privacy Policy for full details.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Settings → Account → Delete Account. Your personal data will be deleted within 30 days. Anonymised platform data may be retained.",
      },
      {
        q: "Does 774ng.com share data with third parties?",
        a: "We never sell personal data. We share data only with service providers (hosting, email delivery) under strict data processing agreements, and with law enforcement when legally required.",
      },
    ],
  },
];

export default function FaqsPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? faqGroups.map((g) => ({
        ...g,
        faqs: g.faqs.filter(
          (f) =>
            f.q.toLowerCase().includes(search.toLowerCase()) ||
            f.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((g) => g.faqs.length > 0)
    : faqGroups;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium">FAQs</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h1>
          </div>
          <p className="text-slate-500 text-sm mb-6">Find answers to common questions about using 774ng.com.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-1">No results for &ldquo;{search}&rdquo;</p>
            <p className="text-sm">Try different keywords or <Link href="/contact" className="text-green-700 underline">contact us</Link>.</p>
          </div>
        )}

        {filtered.map((group) => (
          <div key={group.group}>
            <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-4">{group.group}</h2>
            <div className="space-y-2">
              {group.faqs.map((faq) => {
                const key = `${group.group}-${faq.q}`;
                const isOpen = openItem === key;
                return (
                  <div key={key} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenItem(isOpen ? null : key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-slate-500 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-slate-900 mb-1">Can&apos;t find what you&apos;re looking for?</p>
          <p className="text-sm text-slate-500 mb-4">Our support team is here to help.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
