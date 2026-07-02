"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, FolderOpen, TrendingUp, Eye, Search } from "lucide-react";
import Link from "next/link";

interface LGA {
  id: string;
  lgaName: string;
  state: string;
  isVerified: boolean;
  description: string | null;
  _count: { wards: number; endowments: number };
}

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function ExploreLGAs() {
  const [lgas, setLgas]         = useState<LGA[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [state, setState]       = useState("");
  const [search, setSearch]     = useState("");
  const [query, setQuery]       = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "12" });
    if (state)  params.set("state",  state);
    if (query)  params.set("search", query);

    fetch(`/api/lgas/list?${params}`)
      .then((r) => r.json())
      .then((d) => { setLgas(d.lgas ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <section id="explore" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
            Explore LGAs
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Browse Registered LGAs</h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Find your local government and see what they&apos;re building.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search LGA name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 w-52"
              />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors">
              Search
            </button>
          </form>

          {/* State dropdown */}
          <select
            value={state}
            onChange={(e) => { setState(e.target.value); setQuery(""); setSearch(""); }}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500"
          >
            <option value="">All States</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {(state || query) && (
            <button
              onClick={() => { setState(""); setQuery(""); setSearch(""); }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-green-400 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-52 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && lgas.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">
              {query || state ? "No LGAs match your search" : "No LGAs registered yet"}
            </p>
            <p className="text-sm">
              {query || state ? "Try a different name or state." : "LGAs will appear here as they register."}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && lgas.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {lgas.map((lga) => (
              <motion.div
                key={lga.id}
                variants={cardVariants}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="h-1.5 bg-gradient-to-r from-green-600 to-green-400" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                      {lga.lgaName.charAt(0)}
                    </div>
                    {lga.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">{lga.lgaName} LGA</h3>
                  <p className="text-xs text-slate-500 mb-3">{lga.state} State</p>

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1">
                      <FolderOpen className="h-3 w-3" />
                      {lga._count.wards} wards
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {lga._count.endowments} endowments
                    </span>
                  </div>

                  {lga.description && (
                    <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">{lga.description}</p>
                  )}

                  <Link
                    href={`/lgas/${lga.lgaName.toLowerCase().replace(/\s+/g, "-")}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-50 hover:bg-green-700 hover:text-white text-slate-700 border border-slate-200 hover:border-green-700"
                  >
                    <Eye className="h-3 w-3" />
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/lgas"
            className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            View All LGAs →
          </Link>
          {total > 0 && (
            <p className="text-xs text-slate-400">
              {total} LGA{total !== 1 ? "s" : ""} registered on the platform
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
