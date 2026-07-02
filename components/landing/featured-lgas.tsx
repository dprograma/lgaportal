"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Eye, ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";

interface FeaturedLGA {
  id: string;
  lgaName: string;
  state: string;
  isVerified: boolean;
  _count: { projects: number; endowments: number };
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function FeaturedLGAs() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lgas, setLgas] = useState<FeaturedLGA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lgas/featured")
      .then((r) => r.json())
      .then((d) => setLgas(d.lgas ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -304, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 304, behavior: "smooth" });

  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
            <Trophy className="h-3.5 w-3.5" />
            Top Performing LGAs
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Most Active on the Platform</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            LGAs with the most published projects and listed endowments.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex gap-5 overflow-hidden pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 bg-white rounded-2xl border border-slate-200 h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && lgas.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">No active LGAs yet</p>
            <p className="text-sm">LGAs will appear here as they join and publish projects.</p>
          </div>
        )}

        {!loading && lgas.length > 0 && (
          <div className="relative">
            <button
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-green-500 hover:text-green-700 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto pb-4 scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {lgas.map((lga, idx) => (
                <motion.div
                  key={lga.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.45 }}
                  className="w-72 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-400 hover:shadow-xl transition-all duration-300"
                >
                  {/* Rank ribbon */}
                  <div className="bg-gradient-to-r from-green-800 to-green-600 p-4 relative">
                    <span className="absolute top-3 right-3 text-2xl font-black text-white/20">
                      #{idx + 1}
                    </span>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg mb-2">
                      {lga.lgaName.charAt(0)}
                    </div>
                    <h3 className="text-white font-bold text-base">{lga.lgaName} LGA</h3>
                    <p className="text-green-200 text-xs">{lga.state} State</p>
                  </div>

                  <div className="p-4 space-y-3">
                    {lga.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">
                        <BadgeCheck className="h-3 w-3" />
                        Verified LGA
                      </span>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-50 rounded-xl p-2">
                        <p className="text-lg font-bold text-slate-900">{lga._count.projects}</p>
                        <p className="text-[10px] text-slate-500">Projects</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2">
                        <p className="text-lg font-bold text-slate-900">{lga._count.endowments}</p>
                        <p className="text-[10px] text-slate-500">Endowments</p>
                      </div>
                    </div>

                    <Link
                      href={`/lgas/${toSlug(lga.lgaName)}`}
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      View LGA Profile
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={scrollRight}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-green-500 hover:text-green-700 transition-all"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/leaderboard"
            className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            View Full Leaderboard →
          </Link>
          <p className="text-xs text-slate-400">
            Rankings based on published projects and endowments.
          </p>
        </div>
      </div>
    </section>
  );
}
