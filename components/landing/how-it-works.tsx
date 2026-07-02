"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, MessageSquare, Building2, Gem, TrendingUp, Briefcase, Filter, Handshake } from "lucide-react";
import Link from "next/link";

const citizenSteps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up free in under 2 minutes. No paperwork, no fees. Just your name, email, and the LGA you live in.",
  },
  {
    icon: Search,
    title: "Find Your LGA",
    description: "Browse all 774 LGAs. See projects, budgets, chairman profiles, and natural endowments. Filter by state or zone.",
  },
  {
    icon: MessageSquare,
    title: "Engage & Stay Informed",
    description: "Submit issue reports, follow ongoing projects, vote on community priorities, and celebrate your LGA's wins.",
  },
];

const lgaSteps = [
  {
    icon: Building2,
    title: "Register & Get Verified",
    description: "Submit your LGA's official details and chairman information. Get activated as an investor-ready profile within 3–5 business days.",
  },
  {
    icon: Gem,
    title: "Showcase Endowments & Projects",
    description: "List your natural resources — minerals, farmland, livestock, energy potential. Publish development projects and investment opportunities to attract global partners.",
  },
  {
    icon: TrendingUp,
    title: "Attract Investors & Earn Recognition",
    description: "Receive direct investor inquiries, build citizen trust, and earn platform recognition for completed projects and excellent governance.",
  },
];

const investorSteps = [
  {
    icon: Filter,
    title: "Browse LGA Profiles",
    description: "Filter all 774 Nigerian LGAs by sector: solid minerals, agriculture, livestock, fisheries, energy, or forestry. Find your ideal opportunity.",
  },
  {
    icon: Briefcase,
    title: "Review Endowments & Data",
    description: "Access verified data on natural resources, infrastructure, completed projects, and investment climate for any LGA on the platform.",
  },
  {
    icon: Handshake,
    title: "Connect with LGA Administration",
    description: "Submit your investment interest directly. We facilitate the introduction and connection to the relevant LGA chairman and their team.",
  },
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
const cardVariants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

type Tab = "citizen" | "lga" | "investor";

export default function HowItWorks() {
  const [tab, setTab] = useState<Tab>("lga");

  const steps = tab === "citizen" ? citizenSteps : tab === "lga" ? lgaSteps : investorSteps;

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Three Paths. One Platform.</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Whether you&apos;re an LGA ready to attract investment, a citizen who wants to stay informed,
            or an investor seeking Nigeria&apos;s next big opportunity — we have a path for you.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-slate-200 rounded-2xl w-fit mx-auto mb-14">
          {([
            { id: "lga",      label: "🏛️ For LGAs"       },
            { id: "investor", label: "💼 For Investors"   },
            { id: "citizen",  label: "👤 For Citizens"    },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                tab === id
                  ? "bg-white text-green-700 shadow-sm px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  : "text-slate-500 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-slate-700"
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
            className="relative grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Dashed connector line */}
            <div className="hidden lg:block absolute top-14 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px border-t-2 border-dashed border-green-200 pointer-events-none" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={cardVariants}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300 relative"
                >
                  <span className="inline-flex w-8 h-8 rounded-full bg-green-700 text-white text-sm font-bold items-center justify-center mb-4">
                    {index + 1}
                  </span>
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-green-700" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14">
          <Link href="/lga-signup" className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm">
            Register Your LGA
          </Link>
          <Link href="/invest" className="px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-sm">
            Explore as Investor
          </Link>
          <Link href="/signup" className="px-7 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:border-green-600 hover:text-green-700 font-semibold text-sm transition-colors">
            Join as Citizen
          </Link>
        </div>
      </div>
    </section>
  );
}
