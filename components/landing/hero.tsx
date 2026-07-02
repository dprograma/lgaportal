"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Users,
  BarChart2,
  TrendingUp,
  Gem,
  BadgeCheck,
  Briefcase,
} from "lucide-react";

// ─── CountUp ──────────────────────────────────────────────────────────────────

function CountUp({ end, suffix, started }: { end: number; suffix: string; started: boolean }) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(eased * end));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started, end]);

  return <span>{current.toLocaleString()}{suffix}</span>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const counters = [
  { value: 12847, suffix: "+", label: "Registered Citizens",   icon: Users      },
  { value: 142,   suffix: "",  label: "LGAs Showcasing",       icon: Building2  },
  { value: 1893,  suffix: "+", label: "Projects Published",    icon: BarChart2  },
];

const trustBadges = [
  "Attract real investors",
  "Showcase your endowments",
  "Earn recognition for performance",
  "Free for citizens",
];

const activityFeed = [
  { text: "Investor inquiry received — Udi LGA mineral endowment", time: "3m ago" },
  { text: "Birnin Kebbi LGA published new agriculture investment profile", time: "11m ago" },
  { text: "Road project completed & praised in Lagos Island LGA", time: "18m ago" },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero() {
  const counterRef = useRef<HTMLDivElement>(null);
  const inView = useInView(counterRef, { once: true, margin: "-80px" });

  return (
    <section className="relative min-h-[92vh] bg-white overflow-hidden pt-28 lg:pt-36">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-green-100/80 via-green-50/40 to-transparent rounded-bl-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #15803d 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-green-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-green-300/20 rounded-full blur-2xl pointer-events-none" />

      {/* Abstract Nigeria map silhouette */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 w-[420px] h-[420px] opacity-[0.06] hidden xl:block pointer-events-none">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M80,60 L120,40 L180,35 L240,45 L300,60 L340,90 L360,130 L350,180 L320,220 L300,260 L280,300 L240,330 L200,350 L170,340 L140,310 L110,280 L90,240 L70,200 L60,160 L65,120 Z" fill="#15803d" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left column */}
          <div className="lg:w-3/5 flex flex-col">
            {/* Announcement chip */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-800 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                Nigeria&apos;s Investment &amp; Governance Platform · 774 LGAs
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6"
            >
              Where Nigeria&apos;s{" "}
              <span className="text-green-700">LGAs</span>{" "}
              Meet the World
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="text-lg text-slate-600 leading-relaxed max-w-xl mb-8"
            >
              The platform where Local Governments showcase their natural endowments,
              attract global investors, and celebrate development milestones — while
              citizens stay informed every step of the way.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Link
                href="/lga-signup"
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Showcase Your LGA
                <Building2 className="h-4 w-4" />
              </Link>
              <Link
                href="/invest"
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Explore Opportunities
                <Briefcase className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="border-2 border-slate-300 text-slate-700 hover:border-green-600 hover:text-green-700 px-8 py-3.5 rounded-xl font-semibold text-base transition-all flex items-center gap-2"
              >
                Join as Citizen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="flex flex-wrap gap-4 text-sm text-slate-500"
            >
              {trustBadges.map((badge) => (
                <span key={badge} className="flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
                  {badge}
                </span>
              ))}
            </motion.div>

            {/* Live counters */}
            <motion.div
              ref={counterRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35 }}
              className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-100"
            >
              {counters.map(({ value, suffix, label, icon: Icon }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    <CountUp end={value} suffix={suffix} started={inView} />
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Icon className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column: live dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:w-2/5 hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated p-5 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-700">Live Activity</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Updated just now</span>
                </div>

                {/* Investment highlight */}
                <div className="rounded-xl bg-gradient-to-br from-green-700 to-green-900 h-28 flex flex-col items-center justify-center mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                  <Gem className="h-8 w-8 text-green-300 mb-1.5" />
                  <span className="text-xs text-green-200 font-semibold">Endowment Showcase</span>
                  <span className="text-[10px] text-green-400/70 mt-0.5">312+ LGAs Listed</span>
                </div>

                {/* Activity feed */}
                <div className="space-y-3">
                  {activityFeed.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium leading-snug">{item.text}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge top-right */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-elevated border border-slate-100 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 whitespace-nowrap">₦2B Inquiry Received</p>
                    <p className="text-[10px] text-slate-400">Just now</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating badge bottom-left */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-elevated border border-slate-100 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <BadgeCheck className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 whitespace-nowrap">Top Performing LGA</p>
                    <p className="text-[10px] text-slate-400">Enugu North · Q1 2025</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
