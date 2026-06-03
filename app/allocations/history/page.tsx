"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Download, BarChart2 } from "lucide-react";
import Papa from "papaparse";
import { STATE_COORDS } from "@/lib/nigeria-coordinates";

interface AllocationRecord {
  id: string; lgaName: string; state: string;
  month: number; year: number;
  amount: string; source: string | null;
}

const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const ALL_STATES  = ["", ...Object.keys(STATE_COORDS).sort()];
const currentYear = new Date().getFullYear();
const YEARS       = Array.from({ length: 10 }, (_, i) => currentYear - i);
const LIMIT       = 25;

function fmtNaira(koboStr: string) {
  const n = Number(koboStr) / 100;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

function fmtNairaFull(koboStr: string) {
  const n = Number(koboStr) / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n);
}

export default function AllocationHistoryPage() {
  const [records,  setRecords]  = useState<AllocationRecord[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [exporting,setExporting]= useState(false);
  const [page,     setPage]     = useState(0);

  const [state,  setState]  = useState("");
  const [lga,    setLga]    = useState("");
  const [month,  setMonth]  = useState("");
  const [yearFrom,setYearFrom] = useState("");
  const [yearTo,  setYearTo]   = useState("");
  const [search,  setSearch]   = useState("");

  const buildParams = useCallback((extra?: Record<string, string>) => {
    const p = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (state)    p.set("state",  state);
    if (lga)      p.set("lga",    lga);
    if (month)    p.set("month",  month);
    if (yearFrom) p.set("yearFrom", yearFrom);
    if (yearTo)   p.set("yearTo",   yearTo);
    if (search)   p.set("search",   search);
    if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p;
  }, [state, lga, month, yearFrom, yearTo, search, page]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/allocations?${buildParams()}`);
    const d = await r.json();
    setRecords(d.records ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [buildParams]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  async function exportCSV() {
    setExporting(true);
    try {
      // Fetch all matching records (up to 5000)
      const r = await fetch(`/api/allocations?${buildParams({ limit: "5000", offset: "0" })}`);
      const d = await r.json();
      const rows: AllocationRecord[] = d.records ?? [];

      const csv = Papa.unparse(rows.map(rec => ({
        LGA:    rec.lgaName,
        State:  rec.state,
        Month:  MONTH_NAMES[rec.month],
        Year:   rec.year,
        "Amount (NGN)": fmtNairaFull(rec.amount).replace("NGN", "").trim(),
        Source: rec.source ?? "",
      })));

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `lga-allocations-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-1">
                <Link href="/allocations" className="hover:underline">Allocations</Link> / Archive
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Historical Archive</h1>
              <p className="text-sm text-slate-500 mt-1">Search and download FAAC allocation data across all years</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/allocations/compare"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
              >
                <BarChart2 className="h-3.5 w-3.5" /> Compare
              </Link>
              <button
                onClick={exportCSV}
                disabled={exporting || total === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <label className="text-xs font-medium text-slate-500 block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="LGA or state name…"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">State</label>
              <div className="relative">
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                >
                  {ALL_STATES.map(s => <option key={s} value={s}>{s || "All States"}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* Month */}
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Month</label>
              <div className="relative">
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All</option>
                  {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={String(i+1)}>{m.slice(0,3)}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* Year From */}
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Year From</label>
              <div className="relative">
                <select
                  value={yearFrom}
                  onChange={e => setYearFrom(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any</option>
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* Year To */}
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Year To</label>
              <div className="relative">
                <select
                  value={yearTo}
                  onChange={e => setYearTo(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any</option>
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setPage(0); fetchRecords(); }}
              className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => { setState(""); setLga(""); setMonth(""); setYearFrom(""); setYearTo(""); setSearch(""); setPage(0); }}
              className="px-4 py-2 border border-slate-200 text-slate-500 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {loading ? "Loading…" : `${total.toLocaleString()} record${total !== 1 ? "s" : ""}`}
            </p>
            {total > 0 && <p className="text-xs text-slate-400">Page {page + 1} of {pages}</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">LGA</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">State</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Period</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (NGN)</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: LIMIT }).map((_, i) => (
                    <tr key={i}>
                      {[70, 50, 40, 60, 40].map((w, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <p className="text-slate-400 text-sm">No records match your filters.</p>
                      <p className="text-slate-300 text-xs mt-1">Try adjusting your search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  records.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{r.lgaName}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{r.state}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                        {MONTH_NAMES[r.month].slice(0,3)} {r.year}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-semibold text-green-700">{fmtNaira(r.amount)}</span>
                        <span className="block text-[11px] text-slate-400">{fmtNairaFull(r.amount)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">{r.source ?? "—"}</td>
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
