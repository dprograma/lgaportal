"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Newspaper,
  ArrowRight,
  TrendingUp,
  Building2,
  Scale,
  BarChart2,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface NewsItem {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tag: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const news: NewsItem[] = [
  {
    id: 1,
    category: "Platform News",
    title: "LGA Portal Reaches 10,000 Registered Citizens",
    excerpt:
      "Nigeria's leading LGA transparency platform hits a major milestone as citizens from all 36 states sign up to track their local governments.",
    date: "15 Mar 2025",
    readTime: "3 min read",
    tag: "Milestone",
    icon: TrendingUp,
    iconBg: "from-green-700 to-green-900",
    iconColor: "text-white",
  },
  {
    id: 2,
    category: "LGA Updates",
    title: "How Kano Municipal Transformed Its Waste Management",
    excerpt:
      "A case study on how open data and citizen feedback helped Kano Municipal LGA overhaul its waste collection system.",
    date: "10 Mar 2025",
    readTime: "6 min read",
    tag: "Case Study",
    icon: Building2,
    iconBg: "from-slate-700 to-slate-900",
    iconColor: "text-white",
  },
  {
    id: 3,
    category: "Policy",
    title: "Federal Government Mandates LGA Budget Transparency",
    excerpt:
      "New directive requires all 774 LGAs to publish quarterly allocation reports. LGA Portal is positioned as the official compliance platform.",
    date: "5 Mar 2025",
    readTime: "4 min read",
    tag: "Policy",
    icon: Scale,
    iconBg: "from-blue-700 to-blue-900",
    iconColor: "text-white",
  },
  {
    id: 4,
    category: "Analysis",
    title: "Q1 2025: Which LGAs Spent Their Allocations Best?",
    excerpt:
      "Our data team analyses federal allocation data to rank LGA spending efficiency and project completion rates for Q1 2025.",
    date: "1 Mar 2025",
    readTime: "8 min read",
    tag: "Data Report",
    icon: BarChart2,
    iconBg: "from-indigo-700 to-indigo-900",
    iconColor: "text-white",
  },
  {
    id: 5,
    category: "LGA Updates",
    title: "Lagos Island Completes Marina Road Ahead of Schedule",
    excerpt:
      "Citizens and contractors credit the public accountability tracking on LGA Portal for the early completion of the major road project.",
    date: "28 Feb 2025",
    readTime: "5 min read",
    tag: "Success Story",
    icon: CheckCircle2,
    iconBg: "from-emerald-700 to-emerald-900",
    iconColor: "text-white",
  },
];

const categories = ["All", "Platform News", "LGA Updates", "Policy", "Analysis"];

export default function NewsUpdates() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? news
      : news.filter((n) => n.category === activeCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1);

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
            Platform News &amp; LGA Updates
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Stay informed with the latest transparency milestones, policy
            changes, and LGA success stories from across Nigeria.
          </motion.p>
        </div>

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

        {/* Featured article */}
        {featured && (
          <motion.div
            key={featured.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-green-300 transition-all mb-6"
          >
            <div className="grid lg:grid-cols-2">
              {/* Icon panel */}
              <div
                className={`h-56 lg:h-auto bg-gradient-to-br ${featured.iconBg} flex items-center justify-center relative`}
              >
                <div className="h-24 w-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <featured.icon className={`h-12 w-12 ${featured.iconColor}`} strokeWidth={1.5} />
                </div>
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
                  {featured.tag}
                </span>
              </div>
              {/* Text */}
              <div className="p-6 lg:p-8 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-2">
                  {featured.category} · {featured.date}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
                  {featured.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{featured.readTime}</span>
                  <Link
                    href="#"
                    className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 transition-colors"
                  >
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Remaining news cards */}
        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {rest.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-green-300 transition-all flex flex-col"
              >
                {/* Icon panel */}
                <div
                  className={`h-32 bg-gradient-to-br ${item.iconBg} flex items-center justify-center relative`}
                >
                  <div className="h-14 w-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <item.icon className={`h-7 w-7 ${item.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                    {item.tag}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1.5">
                    {item.category} · {item.date}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2 flex-1">
                    {item.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-slate-400">{item.readTime}</span>
                    <Link
                      href="#"
                      className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-0.5 transition-colors"
                    >
                      Read <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* View all */}
        <div className="text-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white font-semibold text-sm transition-all"
          >
            View All News <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
