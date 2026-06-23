"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search, MapPin, Calendar, Banknote,
  ChevronLeft, ChevronRight, FolderOpen,
  Layers, MessageSquare,
} from "lucide-react";

interface Project {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  budget: string | null;
  images: string[];
  startDate: string | null;
  expectedEndDate: string | null;
  createdAt: string;
  lga: { id: string; lgaName: string; state: string };
  _count: { reactions: number; comments: number };
}

const CATEGORIES = [
  { value: "",                    label: "All Categories" },
  { value: "ROADS_INFRASTRUCTURE", label: "Roads & Infrastructure" },
  { value: "HEALTH",              label: "Health" },
  { value: "EDUCATION",           label: "Education" },
  { value: "WATER",               label: "Water" },
  { value: "AGRICULTURE",         label: "Agriculture" },
  { value: "OTHER",               label: "Other" },
];

const STATUSES = [
  { value: "",            label: "All Statuses" },
  { value: "PENDING",     label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED",   label: "Completed" },
];

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED:   "bg-green-100 text-green-800",
};

const CATEGORY_ICONS: Record<string, string> = {
  ROADS_INFRASTRUCTURE: "🛣️",
  HEALTH:               "🏥",
  EDUCATION:            "🏫",
  WATER:                "💧",
  AGRICULTURE:          "🌾",
  OTHER:                "📁",
};

const PAGE_SIZE = 24;

function formatBudget(koboStr: string | null) {
  if (!koboStr) return null;
  const amount = Number(BigInt(koboStr)) / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

const cardVariants = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search,   setSearch]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status,   setStatus]   = useState("");
  const [state,    setState]    = useState("");
  const [page,     setPage]     = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [category, status, state]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit:  String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (debouncedSearch) params.set("search",   debouncedSearch);
    if (category)        params.set("category", category);
    if (status)          params.set("status",   status);
    if (state)           params.set("state",    state);

    try {
      const res  = await fetch(`/api/projects?${params}`);
      const data = await res.json();
      setProjects(data.projects ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, status, state, page]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const totalPages   = Math.ceil(total / PAGE_SIZE);
  const hasFilters   = search || category || status || state;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Projects</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">LGA Projects</h1>
          <p className="text-slate-500">
            {loading ? "Loading…" : `${total.toLocaleString()} published project${total !== 1 ? "s" : ""} across Nigeria`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* State */}
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          >
            <option value="">All States</option>
            {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {hasFilters ? (
            <button
              onClick={() => { setSearch(""); setCategory(""); setStatus(""); setState(""); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-sm text-slate-500 mb-5">
            {total === 0
              ? "No projects found"
              : `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total.toLocaleString()} projects`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-32 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-8 bg-slate-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-1">No projects found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {projects.map((project) => {
              const thumb   = project.images[0] ?? null;
              const budget  = formatBudget(project.budget);
              const started = formatDate(project.startDate);
              const href    = `/projects/${project.slug ?? project.id}`;

              return (
                <motion.div
                  key={project.id}
                  variants={cardVariants}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-lg transition-all duration-300 group flex flex-col"
                >
                  {/* Thumbnail / placeholder */}
                  {thumb ? (
                    <div className="h-36 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-4xl">{CATEGORY_ICONS[project.category] ?? "📁"}</span>
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[project.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {project.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        {CATEGORIES.find((c) => c.value === project.category)?.label ?? project.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2 flex-1">
                      {project.title}
                    </h3>

                    {/* LGA */}
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {project.lga.lgaName}, {project.lga.state}
                    </p>

                    {/* Budget + date row */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                      {budget && (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Banknote className="h-3 w-3" />
                          {budget}
                        </span>
                      )}
                      {started && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {started}
                        </span>
                      )}
                    </div>

                    {/* Engagement */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {project._count.reactions} reactions
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {project._count.comments} comments
                      </span>
                    </div>

                    <Link
                      href={href}
                      className="w-full flex items-center justify-center py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-green-700 hover:text-white text-slate-700 border border-slate-200 hover:border-green-700 transition-all"
                    >
                      View Project →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
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
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let pageNum = i;
                if (totalPages > 7) {
                  if (page < 4)               pageNum = i;
                  else if (page > totalPages - 5) pageNum = totalPages - 7 + i;
                  else                        pageNum = page - 3 + i;
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
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
