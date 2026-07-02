"use client";

import { motion } from "framer-motion";
import { Building2, Users, Briefcase, CheckCircle2 } from "lucide-react";

const panels = [
  {
    icon: Building2,
    audience: "For LGA Chairmen",
    tagline: "Project. Attract. Earn Recognition.",
    color: "green",
    benefits: [
      "Showcase your LGA's natural endowments to a global audience",
      "Attract verified investors to your minerals, farmland & energy resources",
      "Build a powerful public profile that earns trust and investment",
      "Get praised and ranked for completed development projects",
      "Compete for investment on merit — and win",
    ],
  },
  {
    icon: Users,
    audience: "For Nigerian Citizens",
    tagline: "Inform. Engage. Hold Accountable.",
    color: "blue",
    benefits: [
      "See what your LGA is doing with federal allocations",
      "Track projects from announcement to ribbon-cutting",
      "Submit issues and get real responses from your LGA",
      "Access open budget and spending data anytime",
      "Vote on the priorities that matter most to your community",
    ],
  },
  {
    icon: Briefcase,
    audience: "For Investors",
    tagline: "Discover. Verify. Connect.",
    color: "amber",
    benefits: [
      "Browse investment opportunities across all 774 Nigerian LGAs",
      "Filter by sector: minerals, agriculture, livestock, energy & more",
      "Access platform-verified endowment and project data",
      "Connect directly with verified LGA administrations",
      "Match your portfolio to Nigeria's fastest-growing zones",
    ],
  },
];

const colorConfig: Record<string, { bg: string; icon: string; badge: string; check: string; border: string }> = {
  green: {
    bg:     "bg-green-700",
    icon:   "text-white",
    badge:  "bg-green-100 text-green-800",
    check:  "text-green-600",
    border: "border-green-200 hover:border-green-400",
  },
  blue: {
    bg:     "bg-blue-700",
    icon:   "text-white",
    badge:  "bg-blue-100 text-blue-800",
    check:  "text-blue-600",
    border: "border-blue-100 hover:border-blue-300",
  },
  amber: {
    bg:     "bg-amber-600",
    icon:   "text-white",
    badge:  "bg-amber-100 text-amber-800",
    check:  "text-amber-600",
    border: "border-amber-100 hover:border-amber-300",
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Symbiotic() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4"
          >
            The 774ng.com Difference
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4"
          >
            A Platform That Works for{" "}
            <span className="text-green-700">Everyone</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Unlike typical government portals, 774ng.com creates real, simultaneous value
            for three audiences — making it a platform every LGA chairman, citizen, and
            investor wants to be part of.
          </motion.p>
        </div>

        {/* Panels */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {panels.map((panel) => {
            const Icon = panel.icon;
            const cfg = colorConfig[panel.color];
            return (
              <motion.div
                key={panel.audience}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`bg-white rounded-2xl border ${cfg.border} shadow-sm hover:shadow-md transition-all duration-300 p-7 flex flex-col`}
              >
                {/* Icon */}
                <div className={`h-12 w-12 rounded-2xl ${cfg.bg} flex items-center justify-center mb-5 shadow-md`}>
                  <Icon className={`h-6 w-6 ${cfg.icon}`} />
                </div>

                {/* Audience label */}
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${cfg.badge}`}>
                  {panel.audience}
                </span>

                {/* Tagline */}
                <h3 className="text-lg font-bold text-slate-900 mb-5 leading-snug">
                  {panel.tagline}
                </h3>

                {/* Benefits */}
                <ul className="space-y-3 flex-1">
                  {panel.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className={`h-4 w-4 ${cfg.check} shrink-0 mt-0.5`} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl py-8 px-6"
        >
          <p className="text-slate-700 font-semibold text-lg mb-1">
            The logic is simple: when LGAs grow, investors win. When investors win, LGAs develop faster.
          </p>
          <p className="text-slate-500 text-sm">
            And citizens benefit every step of the way — because transparency and investment go hand in hand.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
