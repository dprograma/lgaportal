"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Eye, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FeaturedLGA {
  rank: number;
  name: string;
  state: string;
  projects: number;
  citizens: number;
  rating: number;
  badge: string;
  trend: string;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const featured: FeaturedLGA[] = [
  { rank: 1, name: "Kano Municipal",      state: "Kano",   projects: 31, citizens: 4820, rating: 4.8, badge: "🏆 Most Projects",     trend: "+12% this month" },
  { rank: 2, name: "Lagos Island",         state: "Lagos",  projects: 24, citizens: 6210, rating: 4.7, badge: "⭐ Top Rated",          trend: "+8% this month"  },
  { rank: 3, name: "Port Harcourt City",   state: "Rivers", projects: 22, citizens: 3940, rating: 4.6, badge: "🔥 Most Engaged",       trend: "+15% this month" },
  { rank: 4, name: "Ikeja",               state: "Lagos",  projects: 18, citizens: 5100, rating: 4.5, badge: "✅ Recently Verified",  trend: "+6% this month"  },
  { rank: 5, name: "Enugu North",          state: "Enugu",  projects: 15, citizens: 2870, rating: 4.4, badge: "📈 Fast Growing",       trend: "+22% this month" },
  { rank: 6, name: "Aba North",            state: "Abia",   projects: 13, citizens: 2100, rating: 4.2, badge: "🌟 New & Active",       trend: "+18% this month" },
];

export default function FeaturedLGAs() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -304, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 304, behavior: "smooth" });
  };

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
            LGAs with the most projects, highest citizen engagement, and recently verified profiles.
          </p>
        </div>

        {/* Carousel container */}
        <div className="relative">
          {/* Prev button */}
          <button
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-green-500 hover:text-green-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featured.map((lga, idx) => (
              <motion.div
                key={lga.rank}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.45 }}
                className="w-72 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-400 hover:shadow-xl transition-all duration-300"
              >
                {/* Rank ribbon */}
                <div className="bg-gradient-to-r from-green-800 to-green-600 p-4 relative">
                  <span className="absolute top-3 right-3 text-2xl font-black text-white/20">
                    #{lga.rank}
                  </span>
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg mb-2">
                    {lga.name.charAt(0)}
                  </div>
                  <h3 className="text-white font-bold text-base">{lga.name} LGA</h3>
                  <p className="text-green-200 text-xs">{lga.state} State</p>
                </div>

                <div className="p-4 space-y-3">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    {lga.badge}
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-lg font-bold text-slate-900">{lga.projects}</p>
                      <p className="text-[10px] text-slate-500">Projects</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-lg font-bold text-slate-900">{lga.citizens.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">Citizens</p>
                    </div>
                  </div>

                  {/* Star rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i <= Math.floor(lga.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 fill-slate-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">{lga.rating}</span>
                  </div>

                  <p className="text-[11px] text-green-600 font-semibold">{lga.trend}</p>

                  <Link
                    href={`/lgas/${toSlug(lga.name)}`}
                    className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    View LGA Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={scrollRight}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-green-500 hover:text-green-700 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom actions */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/leaderboard"
            className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            View Full Leaderboard →
          </Link>
          <p className="text-xs text-slate-400">
            Rankings update weekly based on projects, engagement, and citizen ratings.
          </p>
        </div>
      </div>
    </section>
  );
}
