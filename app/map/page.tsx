"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Search, Layers, X, ChevronDown, MapPin, Activity } from "lucide-react";
import {
  PROJECT_CATEGORY_COLORS,
  PROJECT_CATEGORY_LABELS,
  STATE_COORDS,
} from "@/lib/nigeria-coordinates";

const MapCanvas = dynamic(() => import("./_components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-green-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading map…</p>
      </div>
    </div>
  ),
});

const ALL_CATEGORIES = Object.keys(PROJECT_CATEGORY_COLORS);
const ALL_STATUSES   = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const ALL_STATES     = Object.keys(STATE_COORDS).sort();

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

// ─── Legend entry ─────────────────────────────────────────────────────────────
function Dot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-full shrink-0 border border-white/60 shadow-sm" style={{ background: color }} />
      <span className="text-[11px] text-slate-600">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MapPage() {
  const [showLGAs,    setShowLGAs]    = useState(true);
  const [showProjects,setShowProjects]= useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses,   setSelectedStatuses]   = useState<string[]>([]);
  const [selectedState,      setSelectedState]       = useState("");
  const [searchQuery,        setSearchQuery]         = useState("");
  const [filtersOpen,        setFiltersOpen]         = useState(false);

  function toggleCategory(c: string) {
    setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }
  function toggleStatus(s: string) {
    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function clearFilters() {
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setSelectedState("");
    setSearchQuery("");
  }

  const hasFilters = selectedCategories.length || selectedStatuses.length || selectedState || searchQuery;

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0 z-20">
        {/* Logo / title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-green-700 flex items-center justify-center">
            <MapPin className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-900 text-sm hidden sm:block">Nigeria LGA Map</span>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-0 flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 max-w-sm">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search LGA or state…"
            className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none flex-1 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* State filter */}
        <div className="relative hidden sm:block">
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="appearance-none bg-slate-100 border-0 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
          >
            <option value="">All States</option>
            {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
        </div>

        {/* Layer toggles */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setShowLGAs(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              showLGAs ? "bg-green-50 border-green-200 text-green-700" : "border-slate-200 text-slate-400"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-green-600 shrink-0" />
            LGAs
          </button>
          <button
            onClick={() => setShowProjects(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              showProjects ? "bg-blue-50 border-blue-200 text-blue-700" : "border-slate-200 text-slate-400"
            }`}
          >
            <Activity className="h-3 w-3 shrink-0" />
            Projects
          </button>
        </div>

        {/* Filter toggle (mobile + category/status) */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            filtersOpen || hasFilters ? "bg-green-700 text-white border-green-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Filters</span>
          {!!hasFilters && (
            <span className="ml-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-white/20 text-[10px] font-bold">
              {Number(selectedCategories.length > 0) + Number(selectedStatuses.length > 0) + Number(!!selectedState) + Number(!!searchQuery)}
            </span>
          )}
        </button>
      </header>

      {/* ── Filter drawer ────────────────────────────────────────────────────── */}
      {filtersOpen && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 z-10 overflow-x-auto shrink-0">
          <div className="flex flex-wrap gap-4 items-start max-w-5xl">
            {/* Mobile: layers */}
            <div className="md:hidden flex gap-2">
              <button
                onClick={() => setShowLGAs(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showLGAs ? "bg-green-50 border-green-200 text-green-700" : "border-slate-200 text-slate-400"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-green-600" /> LGAs
              </button>
              <button
                onClick={() => setShowProjects(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showProjects ? "bg-blue-50 border-blue-200 text-blue-700" : "border-slate-200 text-slate-400"
                }`}
              >
                <Activity className="h-3 w-3" /> Projects
              </button>
            </div>

            {/* Mobile: state */}
            <div className="sm:hidden relative">
              <select
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                className="appearance-none bg-slate-100 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 outline-none"
              >
                <option value="">All States</option>
                {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            </div>

            {/* Categories */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Project Category</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map(cat => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                      style={active
                        ? { background: PROJECT_CATEGORY_COLORS[cat] + "22", borderColor: PROJECT_CATEGORY_COLORS[cat], color: PROJECT_CATEGORY_COLORS[cat] }
                        : { borderColor: "#e2e8f0", color: "#64748b" }
                      }
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PROJECT_CATEGORY_COLORS[cat] }} />
                      {PROJECT_CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statuses */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Project Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map(st => {
                  const active = selectedStatuses.includes(st);
                  return (
                    <button
                      key={st}
                      onClick={() => toggleStatus(st)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        active ? "bg-slate-800 border-slate-800 text-white" : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear */}
            {!!hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium self-end pb-0.5">
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Map ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <MapCanvas
          showLGAs={showLGAs}
          showProjects={showProjects}
          selectedCategories={selectedCategories}
          selectedStatuses={selectedStatuses}
          selectedState={selectedState}
          searchQuery={searchQuery}
        />

        {/* ── Legend (bottom-left) ─────────────────────────────────────────── */}
        <div className="absolute bottom-8 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-lg max-w-[180px]">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Legend</p>

          {showLGAs && (
            <div className="mb-2">
              <p className="text-[10px] text-slate-400 mb-1">LGA</p>
              <Dot color="#16a34a" label="Approved LGA" />
            </div>
          )}

          {showProjects && (
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Projects</p>
              <div className="space-y-0.5">
                {ALL_CATEGORIES.map(cat => (
                  <Dot key={cat} color={PROJECT_CATEGORY_COLORS[cat]} label={PROJECT_CATEGORY_LABELS[cat]} />
                ))}
                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100">
                  <span className="inline-block h-3 w-3 rounded-full shrink-0 border border-white/60 shadow-sm bg-slate-400 opacity-50" />
                  <span className="text-[11px] text-slate-400">Archived</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
