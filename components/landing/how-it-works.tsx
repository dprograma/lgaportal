"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, MessageSquare, Building2, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";

const citizenSteps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description:
      "Sign up free in under 2 minutes. No paperwork, no fees. Just your name, email, and the LGA you live in.",
  },
  {
    icon: Search,
    title: "Find Your LGA",
    description:
      "Browse all 774 LGAs. See projects, budgets, and your chairman's profile. Filter by state or geopolitical zone.",
  },
  {
    icon: MessageSquare,
    title: "Engage & Report",
    description:
      "Submit issue reports, follow ongoing projects, vote on community priorities, and track government accountability.",
  },
];

const lgaSteps = [
  {
    icon: Building2,
    title: "Register Your LGA",
    description:
      "Submit your LGA's official details and chairman information. Our team verifies and activates your account within 3–5 business days.",
  },
  {
    icon: LayoutDashboard,
    title: "Set Up Your Profile",
    description:
      "Upload project details, budget allocations, team profiles, and contact information. Customise your LGA's public page.",
  },
  {
    icon: Users,
    title: "Showcase & Engage",
    description:
      "Publish completed projects, respond to citizen feedback, share achievements, and build trust with your community.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HowItWorks() {
  const [tab, setTab] = useState<"citizen" | "lga">("citizen");

  const steps = tab === "citizen" ? citizenSteps : lgaSteps;

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Two Paths, One Platform</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Whether you're a citizen holding your government accountable or an LGA building public trust, we have
            the tools you need.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mx-auto mb-14">
          <button
            onClick={() => setTab("citizen")}
            className={
              tab === "citizen"
                ? "bg-white text-green-700 shadow-sm px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                : "text-slate-500 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-slate-700"
            }
          >
            👤 For Citizens
          </button>
          <button
            onClick={() => setTab("lga")}
            className={
              tab === "lga"
                ? "bg-white text-green-700 shadow-sm px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                : "text-slate-500 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-slate-700"
            }
          >
            🏛️ For LGAs
          </button>
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
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300 relative"
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
          <Link
            href="/signup"
            className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            Join as a Citizen
          </Link>
          <Link
            href="/lga-signup"
            className="px-7 py-3 rounded-xl border-2 border-green-700 text-green-700 hover:bg-green-50 font-semibold text-sm transition-colors"
          >
            Register Your LGA
          </Link>
        </div>
      </div>
    </section>
  );
}
