"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Newspaper, Search, Radio, Clock, Building2, Globe, Landmark, CalendarDays, ChevronRight } from "lucide-react";

type EntityType = "LGA" | "STATE" | "FEDERAL";

interface PressRelease {
  id: string;
  title: string;
  issuingEntity: string;
  entityType: EntityType;
  dateIssued: string;
  attachmentUrl: string | null;
  lga: { lgaName: string; state: string } | null;
}

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string;
  scheduledAt: string;
  status: "UPCOMING" | "LIVE" | "ENDED";
  lga: { lgaName: string; state: string } | null;
}

const ENTITY_LABELS: Record<EntityType, string> = {
  LGA: "LGA", STATE: "State Government", FEDERAL: "Federal Government",
};
const ENTITY_ICONS: Record<EntityType, typeof Building2> = {
  LGA: Building2, STATE: Landmark, FEDERAL: Globe,
};
const ENTITY_COLORS: Record<EntityType, string> = {
  LGA: "text-green-700 bg-green-50 border-green-200",
  STATE: "text-blue-700 bg-blue-50 border-blue-200",
  FEDERAL: "text-purple-700 bg-purple-50 border-purple-200",
};

function Countdown({ to }: { to: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const target = new Date(to).getTime();
    const update = () => setDiff(Math.max(0, target - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [to]);

  if (diff <= 0) return <span className="text-red-500 font-bold text-xs">Starting now</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const d = Math.floor(h / 24);
  if (d > 0) return <span className="text-xs font-semibold text-slate-600">Starts in {d}d {h % 24}h</span>;
  return <span className="text-xs font-mono font-semibold text-amber-600">{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span>;
}

export default function NewsPage() {
  const [releases,   setReleases]   = useState<PressRelease[]>([]);
  const [streams,    setStreams]     = useState<LiveStream[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [q,          setQ]          = useState("");
  const [dQ,         setDQ]         = useState("");
  const [entityType, setEntityType] = useState<EntityType | "">("");
  const [page,       setPage]       = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    fetch("/api/live-streams").then((r) => r.json()).then((d) => setStreams(d.streams ?? []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDQ(q); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (dQ)         params.set("q",          dQ);
    if (entityType) params.set("entityType", entityType);
    try {
      const res  = await fetch(`/api/press-releases?${params}`);
      const data = await res.json();
      setReleases(data.releases ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, [dQ, entityType, page]);

  useEffect(() => { fetchReleases(); }, [fetchReleases]);

  const liveNow = streams.filter((s) => s.status === "LIVE");
  const upcoming = streams.filter((s) => s.status === "UPCOMING");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#071a0e] to-[#0f3d1f] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-green-200 text-xs font-semibold mb-4">
            <Newspaper className="h-3.5 w-3.5" />
            Official Press & Media
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">News & Press</h1>
          <p className="text-green-200/70 text-sm max-w-xl">
            Official press releases from Nigerian LGAs, State and Federal Government agencies. Always authentic, never rumour.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Live Streams Banner */}
        {(liveNow.length > 0 || upcoming.length > 0) && (
          <div className="mb-8 space-y-3">
            {liveNow.map((s) => (
              <a key={s.id} href={s.streamUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl p-4 transition-colors">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">LIVE</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.title}</p>
                  {s.lga && <p className="text-xs text-red-200">{s.lga.lgaName} LGA</p>}
                </div>
                <Radio className="h-5 w-5 shrink-0" />
              </a>
            ))}
            {upcoming.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Upcoming Live Streams
                </p>
                <div className="space-y-2">
                  {upcoming.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                        {s.lga && <p className="text-xs text-slate-400">{s.lga.lgaName} LGA</p>}
                      </div>
                      <Countdown to={s.scheduledAt} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search press releases…" value={q} onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["", "LGA", "STATE", "FEDERAL"] as const).map((type) => (
              <button key={type} onClick={() => { setEntityType(type); setPage(0); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  entityType === type
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-slate-600 border-slate-200 hover:border-green-300"
                }`}>
                {type === "" ? "All Sources" : ENTITY_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[0,1,2,3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Newspaper className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No press releases found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">{total.toLocaleString()} press release{total !== 1 ? "s" : ""}</p>
            {releases.map((r) => {
              const Icon  = ENTITY_ICONS[r.entityType];
              const color = ENTITY_COLORS[r.entityType];
              return (
                <Link key={r.id} href={`/news/${r.id}`}
                  className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 p-5 hover:border-green-300 hover:shadow-sm transition-all group">
                  <div className={`shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm group-hover:text-green-700 transition-colors mb-1 line-clamp-2">
                      {r.title}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="font-medium text-slate-600">{r.issuingEntity}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(r.dateIssued).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-green-500 transition-colors shrink-0 mt-1" />
                </Link>
              );
            })}

            {/* Pagination */}
            {Math.ceil(total / LIMIT) > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-slate-400">Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white disabled:opacity-40 hover:border-green-300">← Prev</button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * LIMIT >= total}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white disabled:opacity-40 hover:border-green-300">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
