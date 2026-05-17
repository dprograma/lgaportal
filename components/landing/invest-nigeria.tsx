"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Wheat,
  Gem,
  Beef,
  Fish,
  TreePine,
  Zap,
  Sun,
  Droplets,
  ArrowRight,
  MapPin,
  TrendingUp,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

/* ─── Resource categories ─────────────────────────────────────────────────── */
interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;        // tailwind text colour
  activeBg: string;     // tailwind bg colour when selected
}

const categories: Category[] = [
  { id: "all",         label: "All Resources",  icon: TrendingUp, color: "text-green-400",  activeBg: "bg-green-700" },
  { id: "agriculture", label: "Agriculture",     icon: Wheat,      color: "text-lime-400",   activeBg: "bg-lime-700"  },
  { id: "minerals",    label: "Solid Minerals",  icon: Gem,        color: "text-cyan-400",   activeBg: "bg-cyan-700"  },
  { id: "livestock",   label: "Livestock",       icon: Beef,       color: "text-amber-400",  activeBg: "bg-amber-700" },
  { id: "fisheries",   label: "Fisheries",       icon: Fish,       color: "text-blue-400",   activeBg: "bg-blue-700"  },
  { id: "forestry",    label: "Forestry",        icon: TreePine,   color: "text-emerald-400",activeBg: "bg-emerald-700"},
  { id: "energy",      label: "Energy",          icon: Zap,        color: "text-yellow-400", activeBg: "bg-yellow-700"},
];

/* ─── LGA investment profiles ────────────────────────────────────────────── */
interface LGAProfile {
  id: number;
  lga: string;
  state: string;
  tagline: string;
  resources: string[];          // category ids
  highlights: string[];         // bullet points
  investmentRange: string;
  verified: boolean;
  icon: LucideIcon;
  iconBg: string;
  badge: string;
}

const lgaProfiles: LGAProfile[] = [
  {
    id: 1,
    lga: "Udi",
    state: "Enugu",
    tagline: "Coal & Limestone Capital of Southeast Nigeria",
    resources: ["minerals", "agriculture"],
    highlights: [
      "Extensive coal deposits — commercially viable seams",
      "High-grade limestone for cement production",
      "Fertile land for rice and cassava farming",
    ],
    investmentRange: "₦500M – ₦10B+",
    verified: true,
    icon: Gem,
    iconBg: "from-cyan-700 to-cyan-900",
    badge: "Minerals",
  },
  {
    id: 2,
    lga: "Kano Municipal",
    state: "Kano",
    tagline: "Nigeria's Agricultural & Leather Trade Hub",
    resources: ["agriculture", "livestock"],
    highlights: [
      "Largest groundnut processing zone in West Africa",
      "Leading cattle and hide & skin trade corridor",
      "Established agro-processing industrial clusters",
    ],
    investmentRange: "₦200M – ₦5B",
    verified: true,
    icon: Wheat,
    iconBg: "from-amber-700 to-amber-900",
    badge: "Agriculture",
  },
  {
    id: 3,
    lga: "Bonny",
    state: "Rivers",
    tagline: "Deepwater Fisheries & LNG Gateway",
    resources: ["fisheries", "energy"],
    highlights: [
      "Rich Atlantic fishing grounds — tuna, shrimp, crayfish",
      "Host to NLNG — world-class LNG infrastructure",
      "Aquaculture investment zones with tax incentives",
    ],
    investmentRange: "₦1B – ₦50B+",
    verified: true,
    icon: Fish,
    iconBg: "from-blue-700 to-blue-900",
    badge: "Fisheries",
  },
  {
    id: 4,
    lga: "Ekiti",
    state: "Ekiti",
    tagline: "Timber, Cocoa & Renewable Energy Frontier",
    resources: ["forestry", "agriculture", "energy"],
    highlights: [
      "Dense tropical forest belt — sustainable timber harvesting",
      "Premium cocoa and palm oil production",
      "High solar irradiance — ideal for solar farm development",
    ],
    investmentRange: "₦300M – ₦8B",
    verified: false,
    icon: TreePine,
    iconBg: "from-emerald-700 to-emerald-900",
    badge: "Forestry",
  },
  {
    id: 5,
    lga: "Kebbi",
    state: "Kebbi",
    tagline: "Nigeria's Rice Bowl & Inland Fisheries Zone",
    resources: ["agriculture", "fisheries"],
    highlights: [
      "Largest inland rice production corridor in Nigeria",
      "Vast freshwater fisheries along River Niger",
      "Federal ANCHOR Borrowers Programme active",
    ],
    investmentRange: "₦100M – ₦3B",
    verified: true,
    icon: Wheat,
    iconBg: "from-lime-700 to-lime-900",
    badge: "Agriculture",
  },
  {
    id: 6,
    lga: "Nassarawa",
    state: "Nassarawa",
    tagline: "Solid Minerals Powerhouse of North-Central Nigeria",
    resources: ["minerals", "energy"],
    highlights: [
      "Baryte, gemstones, tantalite & columbite deposits",
      "Hydropower potential along River Benue tributaries",
      "State mining investment promotion board active",
    ],
    investmentRange: "₦500M – ₦20B",
    verified: true,
    icon: Gem,
    iconBg: "from-slate-600 to-slate-800",
    badge: "Minerals",
  },
];

/* ─── Animation variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function InvestNigeria() {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all"
      ? lgaProfiles
      : lgaProfiles.filter((p) => p.resources.includes(active));

  const activeCategory = categories.find((c) => c.id === active)!;

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
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
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
            Discover untapped natural endowments — from solid minerals and
            fertile farmland to fisheries and renewable energy — across
            Nigeria&apos;s 774 local governments. Connect directly with LGA
            administrations ready to partner with investors.
          </motion.p>
        </div>

        {/* ── Resource category filters ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((cat) => {
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

        {/* ── LGA cards grid ────────────────────────────────────────────── */}
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
                No LGA profiles found for this category yet.
              </div>
            )}

            {filtered.map((profile) => {
              const Icon = profile.icon;
              return (
                <motion.div
                  key={profile.id}
                  variants={cardVariants}
                  whileHover={{ y: -4 }}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.08] hover:border-green-500/40 hover:shadow-xl hover:shadow-green-900/30 transition-all duration-300 flex flex-col"
                >
                  {/* Icon header */}
                  <div
                    className={`h-28 bg-gradient-to-br ${profile.iconBg} flex items-center justify-center relative flex-shrink-0`}
                  >
                    <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>

                    {/* Resource badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold">
                      {profile.badge}
                    </span>

                    {/* Verified badge */}
                    {profile.verified && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/30 text-green-200 text-[10px] font-bold">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    {/* LGA name & location */}
                    <div className="mb-3">
                      <h3 className="font-bold text-white text-base leading-snug mb-1">
                        {profile.lga} LGA
                      </h3>
                      <p className="text-xs text-green-300/70 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {profile.state} State
                      </p>
                    </div>

                    <p className="text-xs text-white/50 italic mb-4 leading-relaxed">
                      &ldquo;{profile.tagline}&rdquo;
                    </p>

                    {/* Highlights */}
                    <ul className="space-y-1.5 mb-5 flex-1">
                      {profile.highlights.map((h) => (
                        <li
                          key={h}
                          className="flex items-start gap-2 text-xs text-white/70"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    {/* Footer row */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-wide">
                          Investment Range
                        </p>
                        <p className="text-sm font-bold text-green-400">
                          {profile.investmentRange}
                        </p>
                      </div>
                      <Link
                        href={`/lgas/${profile.lga.toLowerCase().replace(/\s+/g, "-")}`}
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

        {/* ── Bottom CTA strip ──────────────────────────────────────────── */}
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
              Register as an investor on LGA Portal and we&apos;ll connect you
              directly with verified local governments that match your sector
              and investment appetite.
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

        {/* ── Stats strip ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
        >
          {[
            { value: "312+",  label: "LGAs with Listed Endowments" },
            { value: "7",     label: "Resource Categories" },
            { value: "₦2.4T", label: "Estimated Untapped Value" },
            { value: "89",    label: "Active Investor Inquiries" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-xl py-4 px-3"
            >
              <p className="text-2xl font-extrabold text-green-400 mb-0.5">
                {stat.value}
              </p>
              <p className="text-[11px] text-white/40 leading-snug">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
