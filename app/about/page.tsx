import Link from "next/link";
import { Shield, Target, Eye, Users, Building2, TrendingUp, Globe, ArrowRight } from "lucide-react";

export const metadata = { title: "About Us – 774ng.com LGA Portal" };

const values = [
  { icon: Eye,       title: "Transparency",  desc: "Every allocation, project, and LGA activity is publicly visible. No secrets, no hidden spending." },
  { icon: Users,     title: "Inclusion",      desc: "Citizens, LGA administrators, and investors all have a voice and a home on this platform." },
  { icon: Shield,    title: "Accountability", desc: "LGAs are verified, content is moderated, and citizens can report issues directly." },
  { icon: TrendingUp,title: "Growth",         desc: "We exist to attract investment to Nigeria's grassroots — where real development happens." },
];

const milestones = [
  { year: "2024", event: "Platform founded with a mission to digitise LGA governance in Nigeria." },
  { year: "Q1 2025", event: "First 100 LGAs registered and verified on the platform." },
  { year: "Q2 2025", event: "Investor inquiry system launched; first LGA–investor connection facilitated." },
  { year: "Q3 2025", event: "Endowment Showcase module introduced across all 36 states." },
  { year: "2026", event: "Expanding to cover all 774 LGAs with real-time allocation tracking." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-green-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Globe className="h-3.5 w-3.5" /> Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
            Built for Nigeria&apos;s{" "}
            <span className="text-green-400">774 Local Governments</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            774ng.com was created to solve a simple but critical problem: Nigeria&apos;s Local
            Government Areas are invisible online. Citizens can&apos;t see how their funds are spent.
            Investors can&apos;t find the opportunities. LGAs can&apos;t showcase what they&apos;ve built.
            We&apos;re changing that.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid sm:grid-cols-2 gap-8">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-8">
          <div className="h-10 w-10 rounded-xl bg-green-700 flex items-center justify-center mb-4">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            To digitise local governance in Nigeria — making every allocation, project, and
            development milestone visible to citizens, accountable to the public, and accessible
            to investors ready to build Nigeria&apos;s future from the grassroots up.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h2>
          <p className="text-slate-600 leading-relaxed">
            A Nigeria where every LGA is a transparent, investable, and celebrated unit of
            development — where chairmen are accountable, citizens are informed, and global
            capital finds its way to local opportunity.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="bg-slate-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-green-300 hover:shadow-md transition-all">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-green-700" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Our Journey</h2>
        <div className="relative border-l-2 border-green-200 pl-8 space-y-8">
          {milestones.map(({ year, event }) => (
            <div key={year} className="relative">
              <div className="absolute -left-[41px] h-4 w-4 rounded-full bg-green-600 border-4 border-white shadow" />
              <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">{year}</p>
              <p className="text-slate-700 leading-relaxed">{event}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-green-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "774", label: "LGAs Covered" },
            { value: "36+", label: "States" },
            { value: "3", label: "User Types" },
            { value: "2024", label: "Founded" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold mb-1">{s.value}</p>
              <p className="text-green-200 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Join the Movement?</h2>
        <p className="text-slate-500 mb-8">Whether you&apos;re a citizen, an LGA administrator, or an investor — there&apos;s a place for you here.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-all shadow-md">
            Join as Citizen <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/lga-signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white font-semibold text-sm transition-all">
            Register Your LGA <Building2 className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
