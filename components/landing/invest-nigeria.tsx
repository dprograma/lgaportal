"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Wheat, Gem, Beef, Fish, TreePine, Zap, Sun, Package,
  ArrowRight, MapPin, TrendingUp, BadgeCheck, type LucideIcon,
} from "lucide-react";

interface Endowment {
  id: string;
  category: string;
  title: string;
  description: string;
  highlights: string[];
  investmentRange: string | null;
  lga: { lgaName: string; state: string; isVerified: boolean };
}

interface PlatformStats {
  totalEndowments: number;
  investorInquiries: number;
  approvedLGAs: number;
}

interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  activeBg: string;
}

const categories: Category[] = [
  { id: "ALL",           label: "All Resources",  icon: TrendingUp, activeBg: "bg-green-700"   },
  { id: "AGRICULTURE",   label: "Agriculture",    icon: Wheat,      activeBg: "bg-lime-700"    },
  { id: "MINERALS",      label: "Solid Minerals", icon: Gem,        activeBg: "bg-cyan-700"    },
  { id: "LIVESTOCK",     label: "Livestock",      icon: Beef,       activeBg: "bg-amber-700"   },
  { id: "FISHERIES",     label: "Fisheries",      icon: Fish,       activeBg: "bg-blue-700"    },
  { id: "FORESTRY",      label: "Forestry",       icon: TreePine,   activeBg: "bg-emerald-700" },
  { id: "ENERGY",        label: "Energy",         icon: Zap,        activeBg: "bg-yellow-700"  },
  { id: "TOURISM",       label: "Tourism",        icon: Sun,        activeBg: "bg-orange-700"  },
  { id: "MANUFACTURING", label: "Manufacturing",  icon: Package,    activeBg: "bg-purple-700"  },
];

const categoryMeta: Record<string, { icon: LucideIcon; iconBg: string }> = {
  AGRICULTURE:   { icon: Wheat,     iconBg: "from-lime-700 to-lime-900"     },
  MINERALS:      { icon: Gem,       iconBg: "from-cyan-700 to-cyan-900"     },
  LIVESTOCK:     { icon: Beef,      iconBg: "from-amber-700 to-amber-900"   },
  FISHERIES:     { icon: Fish,      iconBg: "from-blue-700 to-blue-900"     },
  FORESTRY:      { icon: TreePine,  iconBg: "from-emerald-700 to-emerald-900"},
  ENERGY:        { icon: Zap,       iconBg: "from-yellow-700 to-yellow-900" },
  TOURISM:       { icon: Sun,       iconBg: "from-orange-700 to-orange-900" },
  MANUFACTURING: { icon: Package,   iconBg: "from-purple-700 to-purple-900" },
};

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function InvestNigeria() {
  const [endowments, setEndowments]   = useState<Endowment[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [active, setActive]           = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/lgas/endowments?limit=12").then((r) => r.json()),
      fetch("/api/public/stats").then((r) => r.json()),
    ])
      .then(([endData, statsData]) => {
        setEndowments(endData.endowments ?? []);
        setPlatformStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    active === "ALL" ? endowments : endowments.filter((e) => e.category === active);

  const availableCategories = categories.filter(
    (c) => c.id === "ALL" || endowments.some((e) => e.category === c.id)
  );

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-[#071a0e]">
      {/* Nigerian flag strip */}
      <div className="absolute top-0 left-0 right-0 flex h-1.5 z-10">
        <div className="flex-1 bg-[#008751]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#008751]" />
      </div>

      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-green-300 text-xs font-bold uppercase tracking-widest mb-5"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Investment Opportunities
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight"
          >
            Nigeria&apos;s LGAs Are{" "}
            <span className="text-green-400">Open for Business</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-green-200/70 max-w-2xl mx-auto leading-relaxed"
          >
            Discover natural endowments — from solid minerals and fertile farmland to fisheries and
            renewable energy — across Nigeria&apos;s local governments. Connect directly with LGA
            administrations ready to partner with investors.
          </motion.p>
        </div>

        {/* Category filters */}
        {!loading && endowments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {availableCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = active === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActive(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                    isActive
                      ? `${cat.activeBg} text-white border-transparent shadow-lg`
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && endowments.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">No endowments listed yet</p>
            <p className="text-sm">LGAs are listing their resources. Check back soon.</p>
          </div>
        )}

        {/* Cards */}
        {!loading && endowments.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12"
            >
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-white/40 text-sm">
                  No endowments in this category yet.
                </div>
              )}

              {filtered.slice(0, 6).map((endowment) => {
                const meta = categoryMeta[endowment.category] ?? { icon: Package, iconBg: "from-slate-600 to-slate-800" };
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={endowment.id}
                    variants={cardVariants}
                    whileHover={{ y: -4 }}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.08] hover:border-green-500/40 hover:shadow-xl hover:shadow-green-900/30 transition-all duration-300 flex flex-col"
                  >
                    <div className={`h-28 bg-gradient-to-br ${meta.iconBg} flex items-center justify-center relative flex-shrink-0`}>
                      <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold">
                        {endowment.category.charAt(0) + endowment.category.slice(1).toLowerCase()}
                      </span>
                      {endowment.lga.isVerified && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/30 text-green-200 text-[10px] font-bold">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-3">
                        <h3 className="font-bold text-white text-base leading-snug mb-1">{endowment.title}</h3>
                        <p className="text-xs text-green-300/70 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {endowment.lga.lgaName} LGA, {endowment.lga.state} State
                        </p>
                      </div>

                      <p className="text-xs text-white/50 italic mb-4 leading-relaxed line-clamp-2">
                        &ldquo;{endowment.description}&rdquo;
                      </p>

                      {endowment.highlights.length > 0 && (
                        <ul className="space-y-1.5 mb-5 flex-1">
                          {endowment.highlights.slice(0, 3).map((h) => (
                            <li key={h} className="flex items-start gap-2 text-xs text-white/70">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                          {endowment.investmentRange && (
                            <>
                              <p className="text-[10px] text-white/40 uppercase tracking-wide">Investment Range</p>
                              <p className="text-sm font-bold text-green-400">{endowment.investmentRange}</p>
                            </>
                          )}
                        </div>
                        <Link
                          href={`/lgas/${endowment.lga.lgaName.toLowerCase().replace(/\s+/g, "-")}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-all"
                        >
                          View LGA <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-6"
        >
          <div className="text-center lg:text-left">
            <h3 className="text-xl font-bold text-white mb-1">
              Are you an investor looking for opportunities?
            </h3>
            <p className="text-sm text-green-200/60 max-w-xl">
              Register as an investor and we&apos;ll connect you directly with verified LGAs that match
              your sector and investment appetite.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/invest"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all shadow-lg"
            >
              Register as Investor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/lgas?tab=investment"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-medium text-sm transition-all"
            >
              Browse All LGA Opportunities
            </Link>
          </div>
        </motion.div>

        {/* Stats strip */}
        {platformStats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
          >
            {[
              { value: platformStats.totalEndowments.toString() + "+", label: "Listed Endowments"        },
              { value: categories.length - 1 + "",                     label: "Resource Categories"      },
              { value: platformStats.approvedLGAs.toString() + "+",    label: "Active LGAs"              },
              { value: platformStats.investorInquiries.toString() + "+", label: "Investor Inquiries"     },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl py-4 px-3">
                <p className="text-2xl font-extrabold text-green-400 mb-0.5">{stat.value}</p>
                <p className="text-[11px] text-white/40 leading-snug">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
