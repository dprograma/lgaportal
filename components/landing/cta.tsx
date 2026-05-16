"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Building2, CheckCircle2, ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-[#0f2d1a]">
      {/* Nigerian flag strip at top */}
      <div className="absolute top-0 left-0 right-0 flex h-1.5">
        <div className="flex-1 bg-[#008751]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#008751]" />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-green-300 text-xs font-bold uppercase tracking-widest mb-5"
          >
            Join the Movement
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight"
          >
            Be Part of the{" "}
            <span className="text-green-400">Transparency Revolution</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-green-200/70 max-w-2xl mx-auto leading-relaxed"
          >
            Whether you are a citizen holding your LGA accountable or a local government ready to show what you are building — your place is here.
          </motion.p>
        </div>

        {/* Two-panel CTAs */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Citizens panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-5">
              <Users className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              For Nigerian Citizens
            </h3>
            <p className="text-green-200/70 text-sm leading-relaxed mb-6">
              Track what your local government is doing with federal allocations. Report issues, follow projects, and make your voice count.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                "Free account — always",
                "Track your LGA's projects",
                "Report issues directly",
                "Access open data reports",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-green-100/80"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
            >
              Join as a Citizen <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* LGA panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-5">
              <Building2 className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Is Your LGA on the Map?
            </h3>
            <p className="text-green-200/70 text-sm leading-relaxed mb-6">
              Show your community what you are building. Register your LGA, publish projects, and build citizen trust through radical transparency.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                "Verified LGA profile page",
                "Publish projects & budgets",
                "Receive citizen feedback",
                "Nationwide visibility",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-green-100/80"
                >
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/lga-signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
              >
                Register Your LGA <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-medium text-sm transition-all"
              >
                Nominate an LGA
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-t border-white/10 mt-12 pt-8 grid grid-cols-3 gap-6 text-center"
        >
          {[
            { value: "12,847+", label: "Citizens Registered" },
            { value: "142", label: "LGAs Active" },
            { value: "1,893+", label: "Projects Tracked" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-green-200/60">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
