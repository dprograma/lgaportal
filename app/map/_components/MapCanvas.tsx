"use client";

import { useEffect, useState } from "react";
import {
  MapContainer, TileLayer, CircleMarker, Popup, ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import {
  PROJECT_CATEGORY_COLORS,
  PROJECT_CATEGORY_LABELS,
  NIGERIA_CENTER,
  NIGERIA_BOUNDS,
} from "@/lib/nigeria-coordinates";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LGAMarker {
  id: string; lgaName: string; state: string; chairmanName: string;
  isVerified: boolean; lat: number; lng: number;
  latestAllocation: string | null;
  _count: { posts: number; wards: number };
}

interface ProjectMarker {
  id: string; title: string; category: string; status: string;
  latitude: number; longitude: number; isArchived: boolean;
  lga: { lgaName: string; state: string };
}

interface LGAPopupData {
  id: string; lgaName: string; state: string; chairmanName: string;
  isVerified: boolean; citizenCount: number;
  latestAllocation: { amount: string; month: number; year: number } | null;
  posts: { id: string; title: string; imageUrl: string | null; createdAt: string }[];
  _count: { posts: number; wards: number };
}

interface Props {
  showLGAs: boolean;
  showProjects: boolean;
  selectedCategories: string[];
  selectedStatuses: string[];
  selectedState: string;
  searchQuery: string;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtNaira(koboStr: string) {
  const n = Number(koboStr) / 100;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#22c55e",
};

// ─── LGA Popup (lazy-loaded) ──────────────────────────────────────────────────

function LGAPopupContent({ lgaId, fallback }: { lgaId: string; fallback: LGAMarker }) {
  const [data, setData] = useState<LGAPopupData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/map/lga/${lgaId}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d.lga); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lgaId]);

  if (loading) {
    return (
      <div className="w-52 py-2 text-center">
        <div className="inline-block h-4 w-4 rounded-full border-2 border-slate-300 border-t-green-600 animate-spin" />
        <p className="text-xs text-slate-400 mt-1">Loading…</p>
      </div>
    );
  }

  const d = data;
  if (!d) {
    return (
      <div className="w-52">
        <p className="font-semibold text-slate-800">{fallback.lgaName} LGA</p>
        <p className="text-xs text-slate-500">{fallback.state} State</p>
      </div>
    );
  }

  return (
    <div className="w-60 text-sm font-sans">
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-base shrink-0">
          {d.lgaName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 leading-tight truncate">
            {d.lgaName} LGA
            {d.isVerified && <span className="ml-1 text-green-600">✓</span>}
          </p>
          <p className="text-xs text-slate-400">{d.state} State</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {[
          { label: "Wards", val: d._count.wards },
          { label: "Posts", val: d._count.posts },
          { label: "Citizens", val: d.citizenCount.toLocaleString() },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 rounded-md px-2 py-1 text-center">
            <p className="font-semibold text-slate-700 text-xs">{s.val}</p>
            <p className="text-[10px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chairman */}
      {d.chairmanName && (
        <p className="text-xs text-slate-500 mb-2">
          <span className="font-medium text-slate-600">Chairman:</span> {d.chairmanName}
        </p>
      )}

      {/* Latest allocation */}
      {d.latestAllocation && (
        <div className="bg-green-50 border border-green-100 rounded-md px-2.5 py-1.5 mb-2">
          <p className="text-[10px] font-medium text-green-700 uppercase tracking-wide">Latest Allocation</p>
          <p className="font-semibold text-green-800 text-sm">{fmtNaira(d.latestAllocation.amount)}</p>
          <p className="text-[10px] text-green-600">
            {MONTH_NAMES[d.latestAllocation.month - 1]} {d.latestAllocation.year}
          </p>
        </div>
      )}

      {/* Latest posts */}
      {d.posts.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Recent Updates</p>
          <div className="space-y-1">
            {d.posts.slice(0, 2).map(p => (
              <p key={p.id} className="text-xs text-slate-600 truncate">• {p.title}</p>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/lgas/${d.lgaName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        className="block w-full text-center bg-green-700 hover:bg-green-800 text-white text-xs font-semibold py-1.5 rounded-md transition-colors mt-2"
      >
        View Full Profile →
      </Link>
    </div>
  );
}

// ─── Project Popup ────────────────────────────────────────────────────────────

function ProjectPopupContent({ p }: { p: ProjectMarker }) {
  const color = PROJECT_CATEGORY_COLORS[p.category] ?? "#94a3b8";
  const statusColor = STATUS_COLORS[p.status] ?? "#94a3b8";
  return (
    <div className="w-52 text-sm font-sans">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color }}>{PROJECT_CATEGORY_LABELS[p.category] ?? p.category}</span>
      </div>
      <p className="font-semibold text-slate-800 text-sm leading-tight mb-1">{p.title}</p>
      <p className="text-xs text-slate-400 mb-1.5">{p.lga.lgaName} LGA · {p.lga.state}</p>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: statusColor }} />
        <span className="text-xs text-slate-600">{p.status.replace("_", " ")}</span>
        {p.isArchived && (
          <span className="ml-auto text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Archived</span>
        )}
      </div>
    </div>
  );
}

// ─── Main MapCanvas ───────────────────────────────────────────────────────────

export default function MapCanvas({ showLGAs, showProjects, selectedCategories, selectedStatuses, selectedState, searchQuery }: Props) {
  const [lgas, setLgas]       = useState<LGAMarker[]>([]);
  const [projects, setProjects] = useState<ProjectMarker[]>([]);
  const [lgaCache, setLgaCache] = useState<Record<string, boolean>>({}); // ids that have been clicked → lazy load popup

  useEffect(() => {
    fetch("/api/map/data?type=lgas")
      .then(r => r.json())
      .then(d => setLgas(d.lgas ?? []));
    fetch("/api/map/data?type=projects")
      .then(r => r.json())
      .then(d => setProjects(d.projects ?? []));
  }, []);

  const sq = searchQuery.toLowerCase();

  const filteredLgas = lgas.filter(l =>
    (!selectedState || l.state === selectedState) &&
    (!sq || l.lgaName.toLowerCase().includes(sq) || l.state.toLowerCase().includes(sq))
  );

  const filteredProjects = projects.filter(p =>
    (!selectedCategories.length || selectedCategories.includes(p.category)) &&
    (!selectedStatuses.length   || selectedStatuses.includes(p.status)) &&
    (!selectedState             || p.lga.state === selectedState)
  );

  return (
    <MapContainer
      center={NIGERIA_CENTER}
      zoom={6}
      maxBounds={NIGERIA_BOUNDS}
      maxBoundsViscosity={0.8}
      className="w-full h-full"
      zoomControl={false}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />

      {/* ── LGA Markers ─────────────────────────────────────── */}
      {showLGAs && filteredLgas.map(lga => (
        <CircleMarker
          key={lga.id}
          center={[lga.lat, lga.lng]}
          radius={7}
          pathOptions={{ fillColor: "#16a34a", color: "#fff", weight: 1.5, fillOpacity: 0.85 }}
          eventHandlers={{
            click: () => setLgaCache(prev => ({ ...prev, [lga.id]: true })),
          }}
        >
          <Popup minWidth={220} maxWidth={260}>
            {lgaCache[lga.id]
              ? <LGAPopupContent lgaId={lga.id} fallback={lga} />
              : (
                <div className="w-52">
                  <p className="font-semibold text-slate-800">{lga.lgaName} LGA</p>
                  <p className="text-xs text-slate-500">{lga.state} State</p>
                </div>
              )
            }
          </Popup>
        </CircleMarker>
      ))}

      {/* ── Project Markers ─────────────────────────────────── */}
      {showProjects && filteredProjects.map(p => (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={7}
          pathOptions={{
            fillColor: PROJECT_CATEGORY_COLORS[p.category] ?? "#94a3b8",
            color: "#fff",
            weight: 1.5,
            fillOpacity: p.isArchived ? 0.4 : 0.85,
          }}
        >
          <Popup minWidth={200} maxWidth={220}>
            <ProjectPopupContent p={p} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
