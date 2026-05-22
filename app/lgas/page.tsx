"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Search, MapPin, Users, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface LGA {
  id: string;
  lgaName: string;
  state: string;
  isVerified: boolean;
  description: string;
  sectors: string[];
  _count: { wards: number; endowments: number };
}

const STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const PAGE_SIZE = 24;

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function LGAsPage() {
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [page, setPage] = useState(0);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [selectedState]);

  const fetchLgas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedState) params.set("state", selectedState);

    try {
      const res = await fetch(`/api/lgas/list?${params}`);
      const data = await res.json();
      setLgas(data.lgas ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setLgas([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedState, page]);

  useEffect(() => { fetchLgas(); }, [fetchLgas]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Browse LGAs</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">All 774 Nigerian LGAs</h1>
          <p className="text-slate-500">
            {total > 0 ? `${total.toLocaleString()} local government areas` : "Loading…"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search LGA name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* State filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          >
            <option value="">All States</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {selectedState || search ? (
            <button
              onClick={() => { setSearch(""); setSelectedState(""); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-slate-500 mb-5">
            Showing {lgas.length === 0 ? 0 : page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()} LGAs
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-100 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-8 bg-slate-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : lgas.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-400 text-lg mb-2">No LGAs found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {lgas.map((lga) => (
              <motion.div
                key={lga.id}
                variants={cardVariants}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-lg transition-all duration-300 group flex flex-col"
              >
                {/* Top accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-green-600 to-green-400" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Avatar + verified */}
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

                  <h3 className="font-bold text-slate-900 text-sm mb-0.5 leading-snug">
                    {lga.lgaName} LGA
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {lga.state} State
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lga._count.wards} wards
                    </span>
                    {lga._count.endowments > 0 && (
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {lga._count.endowments} endowment{lga._count.endowments !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-4 flex-1">
                    {lga.description}
                  </p>

                  <Link
                    href={`/lgas/${toSlug(lga.lgaName)}`}
                    className="w-full flex items-center justify-center py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-green-700 hover:text-white text-slate-700 border border-slate-200 hover:border-green-700 transition-all"
                  >
                    View Profile →
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                // Show pages around current
                let pageNum = i;
                if (totalPages > 7) {
                  if (page < 4) pageNum = i;
                  else if (page > totalPages - 5) pageNum = totalPages - 7 + i;
                  else pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      pageNum === page
                        ? "bg-green-700 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-green-400"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
