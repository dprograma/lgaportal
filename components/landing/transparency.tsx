"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  AlertCircle,
  ThumbsUp,
  Globe,
  FileDown,
} from "lucide-react";
import Link from "next/link";

type StatColor = "green" | "blue" | "amber" | "purple" | "red";

const transparencyStats: {
  icon: React.ElementType;
  value: string;
  label: string;
  sub: string;
  color: StatColor;
}[] = [
  {
    icon: DollarSign,
    value: "₦2.4T",
    label: "Total Budget Data Shared",
    sub: "Across 142 active LGAs",
    color: "green",
  },
  {
    icon: CheckCircle2,
    value: "1,247",
    label: "Projects Completed",
    sub: "Verified by citizens",
    color: "green",
  },
  {
    icon: Clock,
    value: "646",
    label: "Projects Ongoing",
    sub: "Real-time tracking",
    color: "blue",
  },
  {
    icon: TrendingUp,
    value: "78%",
    label: "Avg. Citizen Satisfaction",
    sub: "Based on 8,400+ ratings",
    color: "amber",
  },
  {
    icon: FileText,
    value: "3,840",
    label: "Reports Downloaded",
    sub: "Open data access",
    color: "purple",
  },
  {
    icon: AlertCircle,
    value: "4,291",
    label: "Issues Reported",
    sub: "By citizens this year",
    color: "red",
  },
  {
    icon: ThumbsUp,
    value: "68%",
    label: "Resolution Rate",
    sub: "Issues resolved by LGAs",
    color: "green",
  },
  {
    icon: Globe,
    value: "36",
    label: "States Represented",
    sub: "Full national coverage",
    color: "green",
  },
];

const colorClasses: Record<StatColor, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
};

export default function Transparency() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-widest mb-5"
          >
            <Globe className="h-3.5 w-3.5" />
            Transparency &amp; Open Data
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
          >
            Platform-Wide Accountability
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Aggregated data from all registered LGAs — updated in real time.
          </motion.p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {transparencyStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${colorClasses[stat.color]}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mb-1">{stat.value}</p>
              <p className="text-sm font-semibold text-slate-700 mb-0.5">{stat.label}</p>
              <p className="text-xs text-slate-400">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Download Reports CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="h-14 w-14 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
            <FileDown className="h-7 w-7 text-green-700" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Access Open Data Reports
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Download quarterly allocation summaries, project completion reports, and citizen engagement analytics.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/reports/q1-2025"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <FileDown className="h-4 w-4" />
              Download Q1 2025 Report
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white text-sm font-semibold transition-all whitespace-nowrap"
            >
              View All Reports
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
