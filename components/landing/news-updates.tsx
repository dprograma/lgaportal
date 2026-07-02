"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Newspaper,
  ArrowRight,
  TrendingUp,
  Building2,
  Scale,
  Globe,
  type LucideIcon,
} from "lucide-react";

interface PressRelease {
  id: string;
  title: string;
  issuingEntity: string;
  entityType: string;
  dateIssued: string;
  attachmentUrl: string | null;
  lga: { lgaName: string; state: string } | null;
}

type EntityMeta = { label: string; icon: LucideIcon; iconBg: string; tag: string };

const entityMeta: Record<string, EntityMeta> = {
  LGA:      { label: "LGA Updates",   icon: Building2, iconBg: "from-slate-700 to-slate-900",  tag: "LGA Update"   },
  FEDERAL:  { label: "Government",    icon: Scale,     iconBg: "from-blue-700 to-blue-900",    tag: "Federal"      },
  STATE:    { label: "Government",    icon: Scale,     iconBg: "from-indigo-700 to-indigo-900", tag: "State"        },
  NGO:      { label: "Civil Society", icon: Globe,     iconBg: "from-purple-700 to-purple-900", tag: "Civil Society"},
  OTHER:    { label: "Updates",       icon: TrendingUp, iconBg: "from-green-700 to-green-900",  tag: "Update"       },
};

function getMeta(entityType: string): EntityMeta {
  return entityMeta[entityType] ?? entityMeta.OTHER;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsUpdates() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch("/api/press-releases?limit=10")
      .then((r) => r.json())
      .then((d) => setReleases(d.releases ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(releases.map((r) => getMeta(r.entityType).label)))];

  const filtered =
    activeCategory === "All"
      ? releases
      : releases.filter((r) => getMeta(r.entityType).label === activeCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1, 5);

  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-5"
          >
            <Newspaper className="h-3.5 w-3.5" />
            News &amp; Updates
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
          >
            Press Releases &amp; LGA Updates
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Official announcements and updates from LGAs and government bodies on the platform.
          </motion.p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl h-64 animate-pulse border border-slate-200" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-slate-200" />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && releases.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">No press releases yet</p>
            <p className="text-sm">LGA updates and announcements will appear here.</p>
          </div>
        )}

        {!loading && releases.length > 0 && (
          <>
            {/* Filter tabs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="flex flex-wrap justify-center gap-2 mb-10"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-green-700 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            {/* Featured */}
            {featured && (() => {
              const meta = getMeta(featured.entityType);
              const Icon = meta.icon;
              return (
                <motion.div
                  key={featured.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-green-300 transition-all mb-6"
                >
                  <div className="grid lg:grid-cols-2">
                    <div className={`h-56 lg:h-auto bg-gradient-to-br ${meta.iconBg} flex items-center justify-center relative`}>
                      <div className="h-24 w-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Icon className="h-12 w-12 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
                        {meta.tag}
                      </span>
                    </div>
                    <div className="p-6 lg:p-8 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-2">
                        {featured.issuingEntity} · {fmtDate(featured.dateIssued)}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
                        {featured.title}
                      </h3>
                      {featured.lga && (
                        <p className="text-sm text-slate-500 mb-4">
                          {featured.lga.lgaName} LGA, {featured.lga.state} State
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{meta.label}</span>
                        {featured.attachmentUrl ? (
                          <a
                            href={featured.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 transition-colors"
                          >
                            View Release <ArrowRight className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <Link
                            href={`/news/${featured.id}`}
                            className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 transition-colors"
                          >
                            Read more <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Remaining cards */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {rest.map((item, index) => {
                  const meta = getMeta(item.entityType);
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.07 }}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-green-300 transition-all flex flex-col"
                    >
                      <div className={`h-32 bg-gradient-to-br ${meta.iconBg} flex items-center justify-center relative`}>
                        <div className="h-14 w-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                          <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                        </div>
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                          {meta.tag}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1.5">
                          {item.issuingEntity} · {fmtDate(item.dateIssued)}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        {item.lga && (
                          <p className="text-xs text-slate-500 mb-2 line-clamp-1 flex-1">
                            {item.lga.lgaName}, {item.lga.state}
                          </p>
                        )}
                        <div className="flex items-center justify-end mt-auto">
                          {item.attachmentUrl ? (
                            <a
                              href={item.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-0.5 transition-colors"
                            >
                              View <ArrowRight className="h-3 w-3" />
                            </a>
                          ) : (
                            <Link
                              href={`/news/${item.id}`}
                              className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-0.5 transition-colors"
                            >
                              Read <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* View all */}
        <div className="text-center mt-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white font-semibold text-sm transition-all"
          >
            View All Updates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
