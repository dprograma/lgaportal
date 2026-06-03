"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronLeft, ChevronRight, BarChart2, Archive } from "lucide-react";
import { STATE_COORDS } from "@/lib/nigeria-coordinates";

interface AllocationRecord {
  id: string; lgaName: string; state: string;
  month: number; year: number;
  amount: string; source: string | null; isPublished: boolean;
}

const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const ALL_STATES  = ["", ...Object.keys(STATE_COORDS).sort()];

function fmtNaira(koboStr: string) {
  const n = Number(koboStr) / 100;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

const LIMIT = 25;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function AllocationsPage() {
  const [records, setRecords] = useState<AllocationRecord[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);

  // Filters
  const [state,  setState]  = useState("");
  const [lga,    setLga]    = useState("");
  const [month,  setMonth]  = useState("");
  const [year,   setYear]   = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (state) params.set("state", state);
    if (lga)   params.set("lga",   lga);
    if (month) params.set("month", month);
    if (year)  params.set("year",  year);
    const r = await fetch(`/api/allocations?${params}`);
    const d = await r.json();
    setRecords(d.records ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [state, lga, month, year, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  function handleFilter() { setPage(0); fetchRecords(); }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-1">Federal Allocations</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Monthly Allocation Data</h1>
              <p className="text-sm text-slate-500 mt-1">Published FAAC allocations for all 774 LGAs across Nigeria</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/allocations/history"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </Link>
              <Link
                href="/allocations/compare"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
              >
                <BarChart2 className="h-3.5 w-3.5" /> Compare LGAs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            {/* State */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-medium text-slate-500">State</label>
              <div className="relative">
                <select
                  value={state}
                  onChange={e => { setState(e.target.value); setLga(""); }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                >
                  {ALL_STATES.map(s => <option key={s} value={s}>{s || "All States"}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* LGA search */}
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-slate-500">LGA Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={lga}
                  onChange={e => setLga(e.target.value)}
                  placeholder="Search LGA…"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Month */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Month</label>
              <div className="relative">
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Months</option>
                  {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Year */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Year</label>
              <div className="relative">
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Years</option>
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <button
              onClick={handleFilter}
              className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition-colors self-end"
            >
              Filter
            </button>

            {(state || lga || month || year) && (
              <button
                onClick={() => { setState(""); setLga(""); setMonth(""); setYear(""); setPage(0); }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors self-end pb-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {loading ? "Loading…" : `${total.toLocaleString()} record${total !== 1 ? "s" : ""}`}
            </p>
            {total > 0 && (
              <p className="text-xs text-slate-400">
                Page {page + 1} of {pages}
              </p>
            )}
          </div>

          {/* Responsive table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">LGA</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">State</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Month</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Year</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + (i * j * 7) % 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No allocation records found for these filters.
                    </td>
                  </tr>
                ) : (
                  records.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{r.lgaName}</td>
                      <td className="px-4 py-3 text-slate-500">{r.state}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{MONTH_NAMES[r.month]}</td>
                      <td className="px-4 py-3 text-slate-500">{r.year}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700 tabular-nums">{fmtNaira(r.amount)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{r.source ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const pg = page < 3 ? i : page - 2 + i;
                  if (pg >= pages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
                        pg === page ? "bg-green-700 text-white" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {pg + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
