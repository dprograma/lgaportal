import Link from "next/link";
import { ChevronRight, UserPlus, Search, Bell, TrendingUp, BadgeCheck, FileText, Users, ArrowRight } from "lucide-react";

export const metadata = { title: "How It Works – 774ng.com" };

const citizenSteps = [
  { icon: UserPlus,  step: "1", title: "Create a free account",         body: "Sign up in under a minute with just your email. No credit card needed — citizens always use the platform free." },
  { icon: Search,    step: "2", title: "Find your LGA",                 body: "Search by name or state to find your Local Government Area. See their registered profile, wards, and projects." },
  { icon: FileText,  step: "3", title: "Track projects & allocations",  body: "Monitor published projects, view federal allocation records, and see what is being built in your community." },
  { icon: Bell,      step: "4", title: "Engage and report",             body: "Submit feedback, react to projects, flag issues to LGA administrators, and hold your local government accountable." },
];

const lgaSteps = [
  { icon: BadgeCheck, step: "1", title: "Register and verify",          body: "LGA chairmen or designated staff submit registration details. Admin verification takes 3–5 business days." },
  { icon: FileText,   step: "2", title: "Build your LGA profile",       body: "Add your LGA description, wards, key endowments, and uploaded documents. A complete profile ranks higher." },
  { icon: TrendingUp, step: "3", title: "Publish projects & endowments",body: "List ongoing and completed projects. Add natural endowments with investment ranges to attract investors." },
  { icon: Users,      step: "4", title: "Engage citizens and investors",body: "Respond to citizen feedback, track inquiries from investors, and publish press releases to keep stakeholders informed." },
];

const investorSteps = [
  { icon: UserPlus,  step: "1", title: "Register as an investor",       body: "Create an investor profile specifying your sector interests, investment range, and geography." },
  { icon: Search,    step: "2", title: "Discover LGA opportunities",    body: "Browse verified endowments and projects across all 774 LGAs. Filter by state, sector, or investment range." },
  { icon: Bell,      step: "3", title: "Submit an inquiry",             body: "Send a direct inquiry to an LGA. Our team facilitates the introduction and provides due diligence support." },
  { icon: TrendingUp,step: "4", title: "Connect and invest",            body: "Engage directly with LGA administrations. All negotiations and agreements are between you and the LGA." },
];

function StepCard({ step, icon: Icon, title, body }: { step: string; icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-green-700 flex items-center justify-center text-white font-black text-sm shrink-0">
          {step}
        </div>
        <div>
          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center mb-3">
            <Icon className="h-4 w-4 text-green-700" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium">How It Works</span>
          </div>
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4">
              Get Started
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              How 774ng.com Works
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Whether you&apos;re a citizen tracking your LGA, an LGA chairman building a digital
              presence, or an investor seeking opportunities — here&apos;s how to get the most from
              the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* For Citizens */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-700" />
            </div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">For Citizens</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Hold your LGA accountable in 4 steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {citizenSteps.map((s) => <StepCard key={s.step} {...s} />)}
          </div>
          <div className="mt-6">
            <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors">
              Join Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* For LGAs */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <BadgeCheck className="h-4 w-4 text-green-700" />
            </div>
            <span className="text-xs font-bold text-green-700 uppercase tracking-widest">For LGAs</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Get your LGA online and attract investment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {lgaSteps.map((s) => <StepCard key={s.step} {...s} />)}
          </div>
          <div className="mt-6">
            <Link href="/lga-signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
              Register Your LGA <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* For Investors */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber-700" />
            </div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">For Investors</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Discover and connect with LGA investment opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {investorSteps.map((s) => <StepCard key={s.step} {...s} />)}
          </div>
          <div className="mt-6">
            <Link href="/invest" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold transition-colors">
              Explore Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Help CTA */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-slate-400 text-sm mb-5">Read our FAQs or contact the support team.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/faqs" className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors">
              Read FAQs
            </Link>
            <Link href="/contact" className="px-5 py-2.5 rounded-xl border border-slate-600 text-white font-semibold text-sm hover:bg-slate-800 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
