import Link from "next/link";
import { ArrowLeft, Building2, Users, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = { title: "How It Works – 774ng.com LGA Portal" };

const lgaSteps = [
  { n: "01", title: "Register Your LGA",         desc: "The sitting LGA chairman registers with official credentials. Our admin team reviews and verifies the account within 48 hours." },
  { n: "02", title: "Complete Your Profile",      desc: "Add your LGA description, office address, chairman photo, and official contact details. A complete profile builds citizen and investor trust." },
  { n: "03", title: "List Your Endowments",       desc: "Publish your LGA's natural and economic resources — agriculture, solid minerals, fisheries, energy, tourism — with investment ranges and highlights." },
  { n: "04", title: "Publish Projects",           desc: "Add development projects with budgets, timelines, and status. Citizens track progress; investors see active development pipelines." },
  { n: "05", title: "Engage &amp; Respond",       desc: "Respond to citizen feedback, manage investor inquiries, publish press releases, and monitor your LGA analytics dashboard." },
];

const citizenSteps = [
  { n: "01", title: "Join Free",               desc: "Create a free account with just your email and Nigerian state/LGA. No payment required — ever." },
  { n: "02", title: "Find Your LGA",           desc: "Search by name or browse by state. View allocation data, active projects, endowments, and press releases for any LGA." },
  { n: "03", title: "Track &amp; Engage",      desc: "Follow project milestones, submit feedback on completed work, and flag issues directly to LGA administrators." },
  { n: "04", title: "Stay Informed",           desc: "Get updates on federal allocations, new projects, and platform news through your personalised dashboard." },
];

const investorSteps = [
  { n: "01", title: "Browse Opportunities",    desc: "Filter endowments by sector (agriculture, minerals, energy, etc.) and state. Each listing shows investment range, highlights, and LGA contact." },
  { n: "02", title: "Register as Investor",    desc: "Create an investor account to submit inquiries directly to LGA administrations with verified contact details." },
  { n: "03", title: "Submit an Inquiry",       desc: "Send a structured investment inquiry. The LGA chairman receives it instantly and can respond through the platform." },
  { n: "04", title: "Connect &amp; Transact", desc: "All negotiations, agreements, and financial arrangements happen directly between you and the LGA — the platform facilitates the introduction." },
];

function Steps({ steps }: { steps: { n: string; title: string; desc: string }[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((s) => (
        <li key={s.n} className="flex gap-4">
          <div className="h-9 w-9 rounded-xl bg-green-700 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1" dangerouslySetInnerHTML={{ __html: s.title }} />
            <p className="text-xs text-slate-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.desc }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">How It Works</h1>
          <p className="text-slate-500 text-sm">Three groups, one platform — each with a clear, simple journey.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* For LGAs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">For LGA Administrators</h2>
              <p className="text-xs text-slate-500">Chairmen, secretaries, and authorised LGA staff</p>
            </div>
          </div>
          <Steps steps={lgaSteps} />
          <div className="mt-6">
            <Link href="/lga-signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
              Register Your LGA <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* For Citizens */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">For Citizens</h2>
              <p className="text-xs text-slate-500">Any Nigerian resident who wants to stay informed</p>
            </div>
          </div>
          <Steps steps={citizenSteps} />
          <div className="mt-6">
            <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors">
              Join Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* For Investors */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">For Investors</h2>
              <p className="text-xs text-slate-500">Individuals and institutions seeking Nigerian LGA opportunities</p>
            </div>
          </div>
          <Steps steps={investorSteps} />
          <div className="mt-6">
            <Link href="/invest" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors">
              Explore Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Trust note */}
        <section className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Platform Safety</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All LGA accounts are verified by our admin team before being made public. Investment facilitation is introductory only — no financial transactions are processed through the platform. Your data is handled in accordance with the Nigeria Data Protection Act 2023.
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/about" className="hover:text-green-700 transition-colors">About Us</Link>
          <Link href="/faqs"  className="hover:text-green-700 transition-colors">FAQs</Link>
          <Link href="/"      className="hover:text-green-700 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
