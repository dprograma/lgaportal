import Link from "next/link";
import { UserPlus, Search, Bell, TrendingUp, Building2, ShieldCheck, Banknote, ArrowRight } from "lucide-react";

export const metadata = { title: "How It Works – 774ng.com LGA Portal" };

const citizenSteps = [
  { icon: UserPlus,  step: "1", title: "Create a Free Account", desc: "Sign up with your email. No payment required. Citizens always access the platform for free." },
  { icon: Search,    step: "2", title: "Find Your LGA",         desc: "Search by LGA name or state to find your local government. View projects, allocations, and endowments." },
  { icon: Bell,      step: "3", title: "Stay Informed",         desc: "Track project progress, read press releases, and get notified about developments in your area." },
  { icon: ShieldCheck, step: "4", title: "Hold Leaders Accountable", desc: "Submit feedback, report issues, and flag inconsistencies. Your voice is on record." },
];

const lgaSteps = [
  { icon: Building2,   step: "1", title: "Register Your LGA",   desc: "The LGA chairman registers using their official email. We verify the registration against our LGA database." },
  { icon: ShieldCheck, step: "2", title: "Get Verified",         desc: "Submit required documents for admin verification. Verified LGAs get a trust badge visible to investors and citizens." },
  { icon: TrendingUp,  step: "3", title: "Showcase Your LGA",    desc: "Publish projects, list natural endowments, post press releases, and upload allocation data." },
  { icon: Banknote,    step: "4", title: "Attract Investment",   desc: "Investors discover your endowments and submit inquiries. You respond directly through the dashboard." },
];

const investorSteps = [
  { icon: UserPlus,    step: "1", title: "Register as Investor", desc: "Create an investor profile with your sector interests and investment appetite." },
  { icon: Search,      step: "2", title: "Explore Opportunities", desc: "Browse LGA endowments by resource category — agriculture, minerals, energy, fisheries, and more." },
  { icon: Bell,        step: "3", title: "Submit an Inquiry",     desc: "Send a direct inquiry to any LGA you're interested in. The LGA chairman receives it in their dashboard." },
  { icon: Banknote,    step: "4", title: "Connect & Invest",      desc: "The LGA responds, you connect, and negotiate directly. We facilitate introductions, not brokerage." },
];

function StepCard({ icon: Icon, step, title, desc }: { icon: React.ElementType; step: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="h-10 w-10 rounded-xl bg-green-700 text-white flex items-center justify-center font-bold text-sm">{step}</div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-green-600" />
          <h3 className="font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-4">How 774ng.com Works</h1>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
          One platform. Three types of users. One shared goal — a more transparent, investable, and accountable Nigeria.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-20">

        {/* Citizens */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">For Citizens</p>
              <h2 className="text-xl font-bold text-slate-900">Stay Informed & Hold Leaders Accountable</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {citizenSteps.map((s) => <StepCard key={s.step} {...s} />)}
          </div>
          <div className="mt-6">
            <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-all">
              Join Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* LGAs */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-700 uppercase tracking-widest">For LGA Administrators</p>
              <h2 className="text-xl font-bold text-slate-900">Showcase Your LGA to the World</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {lgaSteps.map((s) => <StepCard key={s.step} {...s} />)}
          </div>
          <div className="mt-6">
            <Link href="/lga-signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-all">
              Register Your LGA <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* Investors */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">For Investors</p>
              <h2 className="text-xl font-bold text-slate-900">Discover & Connect with LGA Opportunities</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {investorSteps.map((s) => <StepCard key={s.step} {...s} />)}
          </div>
          <div className="mt-6">
            <Link href="/invest" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all">
              Explore Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* FAQ teaser */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
          <h3 className="font-bold text-slate-900 mb-2">Still have questions?</h3>
          <p className="text-sm text-slate-500 mb-4">Check our frequently asked questions or contact us directly.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/faqs" className="px-5 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-all">View FAQs</Link>
            <Link href="/contact" className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:border-green-500 text-sm font-semibold transition-all">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
