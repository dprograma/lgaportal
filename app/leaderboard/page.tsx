"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Medal, Star, BadgeCheck, MapPin, Users, Layers,
  ChevronRight, Search, TrendingUp, Award, Crown, Filter,
} from "lucide-react";

const STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

type SortKey = "wards" | "endowments" | "name";

interface LGA {
  id: string;
  lgaName: string;
  state: string;
  isVerified: boolean;
  description: string;
  sectors: string[];
  _count: { wards: number; endowments: number };
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
      <Crown className="h-4.5 w-4.5 text-white" />
    </div>
  );
  if (rank === 2) return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow">
      <Medal className="h-4 w-4 text-white" />
    </div>
  );
  if (rank === 3) return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow">
      <Award className="h-4 w-4 text-white" />
    </div>
  );
  return (
    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
      <span className="text-sm font-bold text-slate-500">{rank}</span>
    </div>
  );
}

const PODIUM_GRADIENT = [
  "from-yellow-50 to-amber-50 border-amber-200",
  "from-slate-50 to-slate-100 border-slate-200",
  "from-orange-50 to-amber-50 border-orange-200",
];

export default function LeaderboardPage() {
  const [lgas,    setLgas]    = useState<LGA[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [dSearch, setDSearch] = useState("");
  const [state,   setState]   = useState("");
  const [sort,    setSort]    = useState<SortKey>("wards");
  const [page,    setPage]    = useState(0);
  const PAGE_SIZE = 25;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [state, sort]);

  const fetchLgas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit:  String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (dSearch) params.set("search", dSearch);
    if (state)   params.set("state",  state);

    try {
      const res  = await fetch(`/api/lgas/list?${params}`);
      const data = await res.json();
      let results: LGA[] = data.lgas ?? [];

      // Client-side sort (API returns alpha)
      if (sort === "wards")      results = [...results].sort((a, b) => b._count.wards - a._count.wards);
      if (sort === "endowments") results = [...results].sort((a, b) => b._count.endowments - a._count.endowments);
      if (sort === "name")       results = [...results].sort((a, b) => a.lgaName.localeCompare(b.lgaName));

      setLgas(results);
      setTotal(data.total ?? 0);
    } catch {
      setLgas([]);
    } finally {
      setLoading(false);
    }
  }, [dSearch, state, sort, page]);

  useEffect(() => { fetchLgas(); }, [fetchLgas]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const top3 = lgas.slice(0, 3);
  const rest  = lgas.slice(3);
  const globalOffset = page * PAGE_SIZE;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-[#071a0e] via-green-950 to-[#071a0e] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#008751]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#008751]" />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
          <div className="flex items-center gap-2 text-sm text-green-300/70 mb-5">
            <Link href="/" className="hover:text-green-300 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/80">Leaderboard</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
                <Trophy className="h-3.5 w-3.5" />
                LGA Rankings
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                Nigeria&apos;s Top Performing LGAs
              </h1>
              <p className="text-green-200/60 text-base max-w-xl">
                LGAs ranked by ward coverage, endowment listings, and platform
                engagement. Updated weekly.
              </p>
            </div>

            {/* Top-level stats */}
            <div className="flex gap-4 shrink-0">
              {[
                { label: "LGAs Ranked", value: total || "774" },
                { label: "Verified",    value: "312+"          },
                { label: "States",      value: "36 + FCT"      },
              ].map(({ label, value }) => (
                <div key={label} className="text-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-xl font-extrabold text-green-400">{value}</p>
                  <p className="text-[11px] text-white/40">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search LGA name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
            />
          </div>

          {/* State filter */}
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
          >
            <option value="">All States</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
            >
              <option value="wards">Sort by: Most Wards</option>
              <option value="endowments">Sort by: Most Endowments</option>
              <option value="name">Sort by: Name (A–Z)</option>
            </select>
          </div>

          {(state || search) && (
            <button
              onClick={() => { setSearch(""); setState(""); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:border-red-300 hover:text-red-500 transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            {[0,1,2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-44" />
            ))}
          </div>
        ) : lgas.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
            <Trophy className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No LGAs found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* ── Top 3 podium (first page only, no filters) ── */}
            {page === 0 && !dSearch && !state && top3.length === 3 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-4.5 w-4.5 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-800">Top 3 This Week</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {top3.map((lga, i) => (
                    <motion.div
                      key={lga.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`bg-gradient-to-br ${PODIUM_GRADIENT[i]} border rounded-2xl p-5 relative overflow-hidden`}
                    >
                      {/* rank watermark */}
                      <span className="absolute top-3 right-4 text-6xl font-black text-black/5 select-none">
                        #{i + 1}
                      </span>
                      <div className="flex items-center gap-3 mb-3">
                        <RankBadge rank={i + 1} />
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{lga.lgaName} LGA</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />{lga.state} State
                          </p>
                        </div>
                        {lga.isVerified && (
                          <BadgeCheck className="h-4 w-4 text-green-600 shrink-0 ml-auto" />
                        )}
                      </div>
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-white/70 rounded-xl p-2.5 text-center">
                          <p className="text-base font-bold text-slate-900">{lga._count.wards}</p>
                          <p className="text-[10px] text-slate-500">Wards</p>
                        </div>
                        <div className="flex-1 bg-white/70 rounded-xl p-2.5 text-center">
                          <p className="text-base font-bold text-slate-900">{lga._count.endowments}</p>
                          <p className="text-[10px] text-slate-500">Endowments</p>
                        </div>
                      </div>
                      <Link
                        href={`/lgas/${toSlug(lga.lgaName)}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold transition-colors"
                      >
                        View Profile <ChevronRight className="h-3 w-3" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Full rankings table ── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm">
                  {dSearch || state
                    ? `${total.toLocaleString()} matching LGAs`
                    : `All ${total.toLocaleString()} LGAs`
                  }
                </h2>
                <p className="text-xs text-slate-400">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}
                </p>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-5">LGA</div>
                <div className="col-span-2 text-center">Wards</div>
                <div className="col-span-2 text-center">Endowments</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              <div className="divide-y divide-slate-100">
                {lgas.map((lga, i) => {
                  const rank = globalOffset + i + 1;
                  return (
                    <motion.div
                      key={lga.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-4 items-center hover:bg-slate-50 transition-colors ${
                        rank <= 3 && page === 0 && !dSearch && !state ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Rank */}
                      <div className="hidden sm:flex col-span-1 justify-center">
                        <RankBadge rank={rank} />
                      </div>

                      {/* LGA info */}
                      <div className="col-span-1 sm:col-span-5 flex items-center gap-3">
                        <div className="flex sm:hidden items-center justify-center h-7 w-7 rounded-full bg-slate-100 shrink-0">
                          <span className="text-xs font-bold text-slate-500">{rank}</span>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                          {lga.lgaName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-900 truncate">{lga.lgaName}</span>
                            {lga.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />{lga.state} State
                          </p>
                        </div>
                      </div>

                      {/* Wards */}
                      <div className="hidden sm:flex col-span-2 justify-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          <Users className="h-3 w-3" />
                          {lga._count.wards}
                        </span>
                      </div>

                      {/* Endowments */}
                      <div className="hidden sm:flex col-span-2 justify-center">
                        {lga._count.endowments > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                            <Layers className="h-3 w-3" />
                            {lga._count.endowments}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>

                      {/* Mobile stats row */}
                      <div className="flex sm:hidden gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{lga._count.wards} wards</span>
                        {lga._count.endowments > 0 && (
                          <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{lga._count.endowments} endowments</span>
                        )}
                        {lga.isVerified && (
                          <span className="flex items-center gap-1 text-green-600"><BadgeCheck className="h-3 w-3" />Verified</span>
                        )}
                      </div>

                      {/* Action */}
                      <div className="col-span-1 sm:col-span-2 flex sm:justify-end">
                        <Link
                          href={`/lgas/${toSlug(lga.lgaName)}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-green-700 hover:text-white border border-slate-200 hover:border-green-700 text-slate-700 text-xs font-semibold transition-all"
                        >
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    let p = i;
                    if (totalPages > 7) {
                      if (page < 4)              p = i;
                      else if (page > totalPages - 5) p = totalPages - 7 + i;
                      else                       p = page - 3 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-green-700 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-green-400"
                        }`}
                      >
                        {p + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CTA strip ── */}
        <div className="mt-12 bg-gradient-to-r from-green-800 to-green-700 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-4 w-4 text-green-300" />
              <span className="text-xs font-bold text-green-300 uppercase tracking-widest">Get Listed</span>
            </div>
            <h3 className="text-lg font-bold mb-1">Is your LGA missing from the rankings?</h3>
            <p className="text-sm text-green-100/70">
              Register your LGA to appear on the leaderboard, list your endowments, and engage with citizens.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/lga-signup"
              className="px-6 py-3 rounded-xl bg-white text-green-800 font-semibold text-sm hover:bg-green-50 transition-colors text-center"
            >
              Register Your LGA
            </Link>
            <Link
              href="/lgas"
              className="px-6 py-3 rounded-xl border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition-colors text-center"
            >
              Browse All LGAs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
