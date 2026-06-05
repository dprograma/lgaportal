"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { Plus, X, Download, Share2, BarChart2, RefreshCw } from "lucide-react";
import { STATE_COORDS } from "@/lib/nigeria-coordinates";

interface CompareEntry {
  name: string;
  total: number;
  byMonth: { label: string; amount: number }[];
}

const CHART_COLORS = ["#16a34a","#3b82f6","#f59e0b","#ef4444","#8b5cf6"];
const ALL_STATES   = Object.keys(STATE_COORDS).sort();
const currentYear  = new Date().getFullYear();
const YEARS        = Array.from({ length: 10 }, (_, i) => currentYear - i);

function fmtNaira(kobo: number) {
  const n = kobo / 100;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-slate-500 text-xs truncate max-w-[90px]">{p.name}</span>
          </div>
          <span className="font-semibold text-slate-800 tabular-nums text-xs">{fmtNaira(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompareAllocationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-green-600 animate-spin" /></div>}>
      <CompareAllocationsInner />
    </Suspense>
  );
}

function CompareAllocationsInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // mode: "lgas" or "states"
  const [mode,      setMode]      = useState<"lgas"|"states">("lgas");
  const [entities,  setEntities]  = useState<string[]>([]);
  const [inputVal,  setInputVal]  = useState("");
  const [year,      setYear]      = useState(String(currentYear));
  const [data,      setData]      = useState<CompareEntry[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [copied,    setCopied]    = useState(false);

  // Initialize from URL
  useEffect(() => {
    const lgasParam  = searchParams.get("lgas");
    const statesParam= searchParams.get("states");
    const yearParam  = searchParams.get("year");
    if (lgasParam)   { setMode("lgas");   setEntities(lgasParam.split(",").filter(Boolean).slice(0, 5)); }
    if (statesParam) { setMode("states"); setEntities(statesParam.split(",").filter(Boolean).slice(0, 5)); }
    if (yearParam)   setYear(yearParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComparison = useCallback(async () => {
    if (!entities.length) { setData([]); return; }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ year });
      if (mode === "lgas")   params.set("lgas",   entities.join(","));
      if (mode === "states") params.set("states", entities.join(","));
      const r = await fetch(`/api/allocations/compare?${params}`);
      if (!r.ok) throw new Error("Failed to fetch comparison data.");
      const d = await r.json();
      setData(d.results ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [entities, mode, year]);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  function addEntity() {
    const v = inputVal.trim();
    if (!v || entities.includes(v) || entities.length >= 5) return;
    setEntities(prev => [...prev, v]);
    setInputVal("");
  }

  function removeEntity(e: string) {
    setEntities(prev => prev.filter(x => x !== e));
  }

  // Build chart data: by month
  const chartData = (() => {
    if (!data.length) return [];
    // Collect all month labels
    const labels = Array.from(new Set(data.flatMap(d => d.byMonth.map(m => m.label)))).sort();
    return labels.map(label => {
      const row: Record<string, string|number> = { label };
      data.forEach(d => {
        const found = d.byMonth.find(m => m.label === label);
        row[d.name] = found?.amount ?? 0;
      });
      return row;
    });
  })();

  function updateURL() {
    const p = new URLSearchParams({ year });
    if (entities.length) p.set(mode, entities.join(","));
    router.replace(`/allocations/compare?${p}`);
  }

  async function shareURL() {
    updateURL();
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function exportPNG() {
    try {
      window.print();
    } catch {
      alert("Use browser print (Ctrl+P) to save as PDF/image.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-1">
                <Link href="/allocations" className="hover:underline">Allocations</Link> / Compare
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Allocation Comparison</h1>
              <p className="text-sm text-slate-500 mt-1">Compare FAAC allocations across up to 5 LGAs or states</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={shareURL}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Share"}
              </button>
              <button
                onClick={exportPNG}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Export PNG
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap gap-4 items-start">
            {/* Mode toggle */}
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Compare By</label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {(["lgas", "states"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setEntities([]); }}
                    className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                      mode === m ? "bg-green-700 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {m === "lgas" ? "LGAs" : "States"}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Year</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
              >
                {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>

            {/* Add entity */}
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-slate-500 block mb-1.5">
                Add {mode === "lgas" ? "LGA" : "State"} {entities.length > 0 && `(${entities.length}/5)`}
              </label>
              <div className="flex gap-2">
                {mode === "states" ? (
                  <select
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select state…</option>
                    {ALL_STATES.filter(s => !entities.includes(s)).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addEntity(); }}
                    placeholder="e.g. Ikeja"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
                <button
                  onClick={addEntity}
                  disabled={entities.length >= 5 || !inputVal.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-green-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </div>

            <button
              onClick={fetchComparison}
              disabled={loading || !entities.length}
              className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors self-end"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Selected entities */}
          {entities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
              {entities.map((e, i) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {e}
                  <button onClick={() => removeEntity(e)} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Empty state */}
        {!entities.length && !loading && (
          <div className="bg-white border border-slate-200 rounded-xl py-20 text-center">
            <BarChart2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Add LGAs or states above to compare</p>
            <p className="text-slate-400 text-sm mt-1">Compare up to 5 at once with monthly breakdown</p>
          </div>
        )}

        {/* Chart + table */}
        {(data.length > 0 || loading) && (
          <div className="space-y-6">
            {/* Bar chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Allocation — {year}</h2>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-green-600 animate-spin" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                  No monthly data available for {year}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={v => fmtNaira(v)}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      formatter={v => <span style={{ color: "#475569" }}>{v}</span>}
                    />
                    {data.map((d, i) => (
                      <Bar key={d.name} dataKey={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3,3,0,0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Summary table */}
            {!loading && data.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">Annual Summary — {year}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {mode === "lgas" ? "LGA" : "State"}
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Total ({year})
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                          Monthly Avg
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                          Months Recorded
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data
                        .slice()
                        .sort((a, b) => b.total - a.total)
                        .map((d, i) => {
                          const sorted = data.slice().sort((a, b) => b.total - a.total);
                          const rank   = sorted.findIndex(x => x.name === d.name);
                          const avg    = d.byMonth.length ? d.total / d.byMonth.length : 0;
                          return (
                            <tr key={d.name} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ background: CHART_COLORS[entities.indexOf(d.name) % CHART_COLORS.length] }}
                                  />
                                  <span className="font-medium text-slate-800">{d.name}</span>
                                  {rank === 0 && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">Highest</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-green-700 tabular-nums">{fmtNaira(d.total)}</td>
                              <td className="px-4 py-3 text-right text-slate-500 tabular-nums hidden sm:table-cell">{fmtNaira(avg)}</td>
                              <td className="px-4 py-3 text-right text-slate-400 hidden md:table-cell">{d.byMonth.length}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
