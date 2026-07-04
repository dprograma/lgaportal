import Link from "next/link";
import { ChevronRight, Target, Eye, ShieldCheck, TrendingUp, Users, Globe, BadgeCheck, ArrowRight } from "lucide-react";

export const metadata = { title: "About Us – 774ng.com" };

const values = [
  { icon: Eye,        title: "Transparency",   body: "Every allocation, project, and LGA profile is visible to the public. No hidden data." },
  { icon: ShieldCheck,title: "Accountability", body: "Citizens can report issues. LGAs are rated and ranked by real engagement metrics." },
  { icon: TrendingUp, title: "Investment",     body: "We connect verified LGAs with domestic and diaspora investors looking for opportunities." },
  { icon: Users,      title: "Inclusion",      body: "Free for every Nigerian citizen. Every LGA — from Aba to Zurmi — is represented." },
];

const milestones = [
  { year: "2023", event: "Platform concept developed in response to lack of LGA-level investment data in Nigeria." },
  { year: "2024", event: "Beta launched with 12 pilot LGAs across 6 states. First investor-LGA connections made." },
  { year: "2025", event: "National rollout — all 36 states onboarded. NDPR-compliant data infrastructure deployed." },
  { year: "2026", event: "Investment facilitation module launched. Live allocation tracking goes public." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium">About</span>
          </div>
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4">
              Our Story
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Built for Nigeria&apos;s 774 Local Governments
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              774ng.com is Nigeria&apos;s open platform for LGA transparency, citizen engagement,
              and investment facilitation. We believe that when local governments are visible,
              accountable, and connected to capital — communities grow.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4">
              <Target className="h-3.5 w-3.5" />
              Our Mission
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Bridging the gap between LGAs, citizens, and investors
            </h2>
            <p className="text-slate-500 leading-relaxed mb-4">
              Nigeria has 774 Local Government Areas — each with land, people, natural resources,
              and development needs. Yet most of this potential goes unseen. Federal allocations
              are disbursed but rarely tracked. Projects are announced but seldom monitored.
              Investors want opportunities but can&apos;t find reliable LGA data.
            </p>
            <p className="text-slate-500 leading-relaxed">
              774ng.com was built to fix that. We give LGA administrations a digital presence,
              give citizens tools to hold them accountable, and give investors a trusted directory
              of verified LGA endowments and projects.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "774", label: "LGAs in Nigeria" },
              { value: "36", label: "States + FCT covered" },
              { value: "100%", label: "Free for citizens" },
              { value: "NDPR", label: "Compliant platform" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                <p className="text-3xl font-extrabold text-green-700 mb-1">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What We Stand For</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Four principles guide every decision we make on this platform.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-green-700" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Our Journey</h2>
            <p className="text-slate-500">From concept to Nigeria&apos;s leading LGA platform.</p>
          </div>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-8">
              {milestones.map(({ year, event }) => (
                <div key={year} className="flex gap-6 items-start">
                  <div className="h-12 w-12 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0 relative z-10">
                    {year}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1">
                    <p className="text-sm text-slate-600 leading-relaxed">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-green-700 rounded-2xl p-8 lg:p-12 text-center">
          <Globe className="h-10 w-10 text-green-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Join the movement for LGA transparency</h2>
          <p className="text-green-200 max-w-xl mx-auto mb-6 text-sm leading-relaxed">
            Whether you&apos;re a citizen, an LGA chairman, or an investor — there&apos;s a place for you on 774ng.com.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-green-700 font-semibold text-sm hover:bg-green-50 transition-colors">
              Join Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/lga-signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-green-400 text-white font-semibold text-sm hover:bg-green-600 transition-colors">
              Register Your LGA <BadgeCheck className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
