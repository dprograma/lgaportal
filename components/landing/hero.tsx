"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Users,
  BarChart2,
  Map,
  TrendingUp,
} from "lucide-react";

// ─── CountUp ──────────────────────────────────────────────────────────────────

function CountUp({
  end,
  suffix,
  started,
}: {
  end: number;
  suffix: string;
  started: boolean;
}) {
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
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started, end]);

  return (
    <span>
      {current.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const counters = [
  { value: 12847, suffix: "+", label: "Registered Citizens", icon: Users },
  { value: 142, suffix: "", label: "LGAs on Platform", icon: Building2 },
  { value: 1893, suffix: "+", label: "Projects Tracked", icon: BarChart2 },
];

const trustBadges = [
  "Free for citizens",
  "No credit card required",
  "Verified LGA accounts",
  "Open government data",
];

const activityFeed = [
  { text: "New project in Lagos Island LGA", time: "2m ago" },
  { text: "Ikeja LGA updated Q1 budget", time: "8m ago" },
  { text: "Citizen report filed in Kano Municipal", time: "15m ago" },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero() {
  const counterRef = useRef<HTMLDivElement>(null);
  const inView = useInView(counterRef, { once: true, margin: "-80px" });

  return (
    <section className="relative min-h-[92vh] bg-white overflow-hidden pt-28 lg:pt-36">
      {/* Background decorative elements */}

      {/* Top-right radial gradient blob */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-green-100/80 via-green-50/40 to-transparent rounded-bl-[120px] pointer-events-none" />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #15803d 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Soft glows */}
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-green-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-green-300/20 rounded-full blur-2xl pointer-events-none" />

      {/* Abstract Nigeria map silhouette */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 w-[420px] h-[420px] opacity-[0.06] hidden xl:block pointer-events-none">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M80,60 L120,40 L180,35 L240,45 L300,60 L340,90 L360,130 L350,180 L320,220 L300,260 L280,300 L240,330 L200,350 L170,340 L140,310 L110,280 L90,240 L70,200 L60,160 L65,120 Z"
            fill="#15803d"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left column */}
          <div className="lg:w-3/5 flex flex-col">
            {/* Announcement chip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-800 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                Live Platform · 774 LGAs · Open to All Nigerians
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6"
            >
              Connecting Citizens to All{" "}
              <br />
              <span className="text-green-700">774 Local</span>
              <br />
              Governments
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="text-lg text-slate-600 leading-relaxed max-w-xl mb-8"
            >
              Nigeria&apos;s first open platform for LGA transparency. Discover your
              local government, track development projects, report issues, and hold
              elected officials accountable — all in one place.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Link
                href="/signup"
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Join as a Citizen
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/lga-signup"
                className="border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all flex items-center gap-2"
              >
                Register Your LGA
                <Building2 className="h-4 w-4" />
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
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
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
                {/* Live Activity header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-700">
                      Live Activity
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Updated just now
                  </span>
                </div>

                {/* Mini map placeholder */}
                <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 h-48 flex flex-col items-center justify-center mb-4">
                  <Map className="h-16 w-16 text-green-300" />
                  <span className="text-xs text-green-500 font-medium mt-2">
                    Interactive Map
                  </span>
                </div>

                {/* Activity feed */}
                <div className="space-y-3">
                  {activityFeed.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium leading-snug">
                          {item.text}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.time}
                        </p>
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
                    <p className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                      ₦120M Released
                    </p>
                    <p className="text-[10px] text-slate-400">Just now</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating badge bottom-left */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-elevated border border-slate-100 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                      LGA Verified
                    </p>
                    <p className="text-[10px] text-slate-400">Enugu North</p>
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
