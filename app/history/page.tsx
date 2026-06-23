"use client";

import { useState, useCallback } from "react";
import { Search, BookOpen, Briefcase, DollarSign, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

type ResultType = "post" | "project" | "allocation";

interface PostResult {
  type: "post";
  id: string;
  title: string;
  slug: string;
  lgaName: string;
  state: string;
  chairmanName: string | null;
  publishedAt: string | null;
  tenure: { chairmanName: string; startDate: string; endDate: string | null } | null;
}
interface ProjectResult {
  type: "project";
  id: string;
  title: string;
  description: string;
  status: string;
  lgaName: string;
  state: string;
  startDate: string;
  endDate: string | null;
}
interface AllocationResult {
  type: "allocation";
  id: string;
  year: number;
  amount: string;
  lgaName: string;
  state: string;
  source: string;
  quarter: string | null;
}

type SearchResult = PostResult | ProjectResult | AllocationResult;

interface ApiResponse {
  posts: PostResult[];
  projects: ProjectResult[];
  allocations: AllocationResult[];
  total: number;
}

const TABS = [
  { key: "all",        label: "All Results",   icon: Search       },
  { key: "post",       label: "Posts",         icon: FileText     },
  { key: "project",    label: "Projects",      icon: Briefcase    },
  { key: "allocation", label: "Allocations",   icon: DollarSign   },
] as const;

function naira(koboStr: string) {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
      .format(Number(BigInt(koboStr)) / 100);
  } catch {
    return koboStr;
  }
}

export default function HistoryPage() {
  const [q,            setQ]            = useState("");
  const [lgaName,      setLgaName]      = useState("");
  const [chairmanName, setChairmanName] = useState("");
  const [yearFrom,     setYearFrom]     = useState("");
  const [yearTo,       setYearTo]       = useState("");
  const [tab,          setTab]          = useState<"all" | ResultType>("all");

  const [results,  setResults]  = useState<ApiResponse | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async () => {
    const params = new URLSearchParams();
    if (q)            params.set("q",            q);
    if (lgaName)      params.set("lgaName",      lgaName);
    if (chairmanName) params.set("chairmanName", chairmanName);
    if (yearFrom)     params.set("yearFrom",     yearFrom);
    if (yearTo)       params.set("yearTo",       yearTo);
    if (tab !== "all") params.set("type",        tab);

    setLoading(true);
    try {
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      setResults(data);
      setSearched(true);
    } catch {
      setResults(null);
    }
    finally { setLoading(false); }
  }, [q, lgaName, chairmanName, yearFrom, yearTo, tab]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") doSearch(); };

  const posts       = results?.posts       ?? [];
  const projects    = results?.projects    ?? [];
  const allocations = results?.allocations ?? [];
  const total       = results?.total       ?? 0;

  const showPosts       = tab === "all" || tab === "post";
  const showProjects    = tab === "all" || tab === "project";
  const showAllocations = tab === "all" || tab === "allocation";

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-900 to-green-700 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-green-200 text-xs font-semibold mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            Historical Records
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">LGA Historical Archive</h1>
          <p className="text-green-200 max-w-xl mx-auto text-sm leading-relaxed">
            Search archived posts, projects, and allocation records across all LGAs and past administrations.
          </p>
        </div>
      </div>

      {/* Search panel */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-slate-100">
          {/* Main search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text" placeholder="Search by keyword, topic, or description…"
              value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={handleKey}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <input type="text" placeholder="LGA name…" value={lgaName}
              onChange={(e) => setLgaName(e.target.value)} onKeyDown={handleKey}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
            <input type="text" placeholder="Chairman name…" value={chairmanName}
              onChange={(e) => setChairmanName(e.target.value)} onKeyDown={handleKey}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
            <select value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 bg-white text-slate-500">
              <option value="">From year…</option>
              {Array.from({ length: 30 }, (_, i) => currentYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={yearTo} onChange={(e) => setYearTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 bg-white text-slate-500">
              <option value="">To year…</option>
              {Array.from({ length: 30 }, (_, i) => currentYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Type tabs + Search button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 flex-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key as typeof tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tab === key ? "bg-green-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>
            <button onClick={doSearch} disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {!searched && !loading ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-200" />
            <p className="font-medium text-slate-500">Enter a keyword or filter to search the archive</p>
            <p className="text-sm mt-1">You can search by LGA name, chairman name, year range, or keyword</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[0,1,2,3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="text-center py-16">
            <Search className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            <p className="font-medium text-slate-500">No records found</p>
            <p className="text-sm text-slate-400 mt-1">Try different keywords or adjust your filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">{total.toLocaleString()} result{total !== 1 ? "s" : ""} found</p>

            {/* Posts */}
            {showPosts && posts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-green-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Archived Posts ({posts.length})</h2>
                </div>
                <div className="space-y-2">
                  {posts.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-green-200 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm leading-snug mb-1">{p.title}</p>
                          <p className="text-xs text-slate-400">
                            {p.lgaName} LGA, {p.state}
                            {p.tenure && ` · Under ${p.tenure.chairmanName}`}
                            {p.publishedAt && ` · ${new Date(p.publishedAt).toLocaleDateString("en-NG", { year: "numeric", month: "short" })}`}
                          </p>
                        </div>
                        <Link href={`/lgas/${p.slug ?? p.id}`}
                          className="shrink-0 flex items-center gap-1 text-green-700 hover:text-green-900 text-xs font-medium">
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {showProjects && projects.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-blue-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Projects ({projects.length})</h2>
                </div>
                <div className="space-y-2">
                  {projects.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 text-sm">{p.title}</p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 uppercase">{p.status}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {p.lgaName} LGA, {p.state}
                            {p.startDate && ` · Started ${new Date(p.startDate).toLocaleDateString("en-NG", { year: "numeric", month: "short" })}`}
                            {p.endDate   && ` – ${new Date(p.endDate).toLocaleDateString("en-NG",   { year: "numeric", month: "short" })}`}
                          </p>
                          {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Allocations */}
            {showAllocations && allocations.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-emerald-700" />
                  <h2 className="font-semibold text-slate-800 text-sm">Allocations ({allocations.length})</h2>
                </div>
                <div className="space-y-2">
                  {allocations.map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-emerald-200 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {a.lgaName} LGA — {a.year}{a.quarter ? ` Q${a.quarter}` : ""}
                          </p>
                          <p className="text-xs text-slate-400">{a.state} · {a.source}</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-700 shrink-0">{naira(a.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
