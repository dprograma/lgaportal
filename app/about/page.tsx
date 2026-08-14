import Link from "next/link";
import { ArrowLeft, Building2, Users, TrendingUp, ShieldCheck, Globe, BadgeCheck } from "lucide-react";

export const metadata = { title: "About Us – 774ng.com LGA Portal" };

const team = [
  { role: "Mission", text: "To make Nigerian local government transparent, investable, and accountable to every citizen." },
  { role: "Vision",  text: "A Nigeria where every one of its 774 LGAs is a visible, trusted, and thriving economic unit." },
  { role: "Values",  text: "Transparency, accountability, inclusion, and the belief that development starts locally." },
];

const pillars = [
  { icon: Building2,   title: "For LGAs",       desc: "Verified LGA chairmen can publish projects, list natural endowments, share press releases, and attract investment — all from one dashboard." },
  { icon: Users,       title: "For Citizens",    desc: "Nigerian citizens can track federal allocations, monitor project delivery, submit feedback, and report issues in their local government." },
  { icon: TrendingUp,  title: "For Investors",   desc: "Investors discover sector-specific opportunities — agriculture, minerals, energy, tourism — directly from LGA administrations ready to partner." },
  { icon: ShieldCheck, title: "For Governance",  desc: "Platform analytics and open data give civil society, researchers, and oversight bodies real insight into LGA performance across Nigeria." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Globe className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">About 774ng.com</h1>
          </div>
          <p className="text-slate-500 text-sm">Nigeria&apos;s open platform for LGA transparency, citizen accountability, and investment facilitation.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* Origin */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Why 774?</h2>
          <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 space-y-3">
            <p>
              Nigeria has <strong>774 Local Government Areas</strong> — the closest tier of government to the people. Yet for most Nigerians, what happens inside their LGA remains opaque: allocations are received, projects are announced, and years pass with little visible progress or accountability.
            </p>
            <p>
              774ng.com was built to change that. We believe that if citizens can see what their LGA is doing, investors can see what an LGA has to offer, and LGA administrators are given the tools to tell their story — Nigeria&apos;s grassroots development accelerates dramatically.
            </p>
            <p>
              The name <strong>774</strong> is a declaration: every single Local Government Area in Nigeria matters, deserves a digital presence, and deserves to be held accountable.
            </p>
          </div>
        </section>

        {/* Mission / Vision / Values */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Mission, Vision &amp; Values</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {team.map((t) => (
              <div key={t.role} className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">{t.role}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Who the Platform Serves</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="flex gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1">{p.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Numbers */}
        <section className="bg-slate-900 rounded-2xl p-8 text-white">
          <h2 className="text-lg font-bold mb-6 text-center">Built for Scale</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { n: "774", label: "LGAs in Nigeria" },
              { n: "36+", label: "States Covered" },
              { n: "8",   label: "Resource Categories" },
              { n: "100%", label: "Open to Citizens" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-green-400 mb-1">{s.n}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Legal compliance */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Legal &amp; Compliance</h2>
          <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
            <p>774ng.com operates in compliance with Nigerian law, including the Nigeria Data Protection Act 2023 (NDPA), the Freedom of Information Act 2011, and applicable regulations of the Federal Republic of Nigeria.</p>
            <p>We are not a government body. We are an independent platform that facilitates transparency and investment — we do not broker, guarantee, or execute government contracts or financial transactions.</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: "NDPA 2023 Compliant",         icon: BadgeCheck },
              { label: "Freedom of Information Act",  icon: BadgeCheck },
              { label: "Independent Platform",        icon: BadgeCheck },
            ].map(({ label, icon: Icon }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <Icon className="h-3.5 w-3.5" />{label}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to get started?</h3>
          <p className="text-sm text-slate-500 mb-5">Join as a citizen, register your LGA, or explore investment opportunities.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup"     className="px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">Join as Citizen</Link>
            <Link href="/lga-signup" className="px-6 py-2.5 rounded-xl border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white text-sm font-semibold transition-colors">Register LGA</Link>
            <Link href="/invest"     className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-slate-400 text-sm font-semibold transition-colors">Explore Investments</Link>
          </div>
        </section>

        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/how-it-works" className="hover:text-green-700 transition-colors">How It Works</Link>
          <Link href="/faqs"         className="hover:text-green-700 transition-colors">FAQs</Link>
          <Link href="/terms"        className="hover:text-green-700 transition-colors">Terms of Service</Link>
          <Link href="/"             className="hover:text-green-700 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
