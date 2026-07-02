"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  HardHat,
  HeartPulse,
  Droplets,
  GraduationCap,
  Wheat,
  Building2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  budget: string | null;
  images: string[];
  createdAt: string;
  lga: { lgaName: string; state: string };
  _count: { reactions: number; comments: number };
}

type FilterType = "All" | "IN_PROGRESS" | "COMPLETED" | "PENDING";
const filters: { label: string; value: FilterType }[] = [
  { label: "All",       value: "All"         },
  { label: "Ongoing",   value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED"   },
  { label: "Planned",   value: "PENDING"     },
];

const categoryMeta: Record<string, { icon: LucideIcon; bg: string }> = {
  ROADS_INFRASTRUCTURE: { icon: HardHat,      bg: "from-slate-600 to-slate-800"   },
  HEALTH:               { icon: HeartPulse,   bg: "from-red-600 to-red-800"       },
  WATER:                { icon: Droplets,     bg: "from-blue-600 to-blue-800"     },
  EDUCATION:            { icon: GraduationCap,bg: "from-amber-600 to-amber-800"   },
  AGRICULTURE:          { icon: Wheat,        bg: "from-green-600 to-green-800"   },
  OTHER:                { icon: Building2,    bg: "from-purple-600 to-purple-800" },
};

const statusMeta: Record<string, { label: string; color: string; progress: number }> = {
  IN_PROGRESS: { label: "Ongoing",   color: "bg-blue-100 text-blue-700",   progress: 50  },
  COMPLETED:   { label: "Completed", color: "bg-green-100 text-green-700", progress: 100 },
  PENDING:     { label: "Planned",   color: "bg-amber-100 text-amber-700", progress: 5   },
};

function fmtBudget(raw: string | null): string {
  if (!raw) return "";
  const n = Number(raw);
  if (isNaN(n)) return raw;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(0)}M`;
  return `₦${n.toLocaleString()}`;
}

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function ProjectsFeed() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterType>("All");

  useEffect(() => {
    fetch("/api/projects?limit=12")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All" ? projects : projects.filter((p) => p.status === filter);

  return (
    <section id="projects" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-widest mb-4"
          >
            Development Projects
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
          >
            Projects Across Nigeria
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed"
          >
            Real projects, real progress. Follow development happening in LGAs nationwide.
          </motion.p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mx-auto mb-10">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={
                filter === f.value
                  ? "bg-white text-green-700 shadow-sm px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  : "text-slate-500 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-slate-700"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-72 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <HardHat className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">No projects yet</p>
            <p className="text-sm">Projects will appear here as LGAs publish them.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.slice(0, 6).map((project) => {
                const catMeta  = categoryMeta[project.category] ?? categoryMeta.OTHER;
                const statMeta = statusMeta[project.status]    ?? statusMeta.PENDING;
                const Icon     = catMeta.icon;
                const budget   = fmtBudget(project.budget);

                return (
                  <motion.div
                    key={project.id}
                    variants={cardVariants}
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-green-300 transition-all duration-300"
                  >
                    {/* Icon header */}
                    <div className={`h-28 bg-gradient-to-br ${catMeta.bg} flex items-center justify-center relative`}>
                      <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                      </div>
                      <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${statMeta.color}`}>
                        {statMeta.label}
                      </span>
                    </div>

                    <div className="p-4">
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                        {project.category.replace(/_/g, " ")}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1 mb-1 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {project.lga.lgaName} LGA, {project.lga.state}
                      </p>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{statMeta.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div
                            className={`h-full rounded-full transition-all ${
                              project.status === "COMPLETED" ? "bg-green-500" :
                              project.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${statMeta.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          {budget || fmtMonth(project.createdAt)}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {project._count.reactions}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {project._count.comments}
                          </span>
                          <Link
                            href={project.slug ? `/projects/${project.slug}` : `/projects/${project.id}`}
                            className="hover:text-green-600 transition-colors"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Bottom */}
        {!loading && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <Link
              href="/projects"
              className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
            >
              Explore All Projects →
            </Link>
            {projects.length > 0 && (
              <p className="text-xs text-slate-400">{projects.length}+ projects tracked on the platform</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
