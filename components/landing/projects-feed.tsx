"use client";

import { useState } from "react";
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
  Store,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface Project {
  id: number;
  title: string;
  lga: string;
  state: string;
  status: "Ongoing" | "Completed" | "Planned";
  progress: number;
  category: string;
  date: string;
  budget: string;
  icon: LucideIcon;
  iconBg: string;
  likes: number;
  comments: number;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Marina Road Rehabilitation",
    lga: "Lagos Island",
    state: "Lagos",
    status: "Ongoing",
    progress: 65,
    category: "Infrastructure",
    date: "Mar 2025",
    budget: "₦450M",
    icon: HardHat,
    iconBg: "from-slate-600 to-slate-800",
    likes: 142,
    comments: 38,
  },
  {
    id: 2,
    title: "Primary Health Centre Renovation",
    lga: "Gwale",
    state: "Kano",
    status: "Completed",
    progress: 100,
    category: "Healthcare",
    date: "Jan 2025",
    budget: "₦120M",
    icon: HeartPulse,
    iconBg: "from-red-600 to-red-800",
    likes: 89,
    comments: 21,
  },
  {
    id: 3,
    title: "10 New Borehole Installations",
    lga: "Udi",
    state: "Enugu",
    status: "Completed",
    progress: 100,
    category: "Water & Sanitation",
    date: "Feb 2025",
    budget: "₦75M",
    icon: Droplets,
    iconBg: "from-blue-600 to-blue-800",
    likes: 203,
    comments: 47,
  },
  {
    id: 4,
    title: "Public Primary School Block",
    lga: "Ikeja",
    state: "Lagos",
    status: "Ongoing",
    progress: 40,
    category: "Education",
    date: "Apr 2025",
    budget: "₦280M",
    icon: GraduationCap,
    iconBg: "from-amber-600 to-amber-800",
    likes: 67,
    comments: 15,
  },
  {
    id: 5,
    title: "Market Redevelopment Project",
    lga: "Kano Municipal",
    state: "Kano",
    status: "Planned",
    progress: 10,
    category: "Commerce",
    date: "May 2025",
    budget: "₦320M",
    icon: Store,
    iconBg: "from-purple-600 to-purple-800",
    likes: 55,
    comments: 12,
  },
  {
    id: 6,
    title: "Youth Sports Complex",
    lga: "Port Harcourt City",
    state: "Rivers",
    status: "Ongoing",
    progress: 55,
    category: "Sports & Recreation",
    date: "Mar 2025",
    budget: "₦190M",
    icon: Dumbbell,
    iconBg: "from-green-600 to-green-800",
    likes: 178,
    comments: 52,
  },
];

const filters = ["All", "Ongoing", "Completed", "Planned"] as const;
type FilterType = (typeof filters)[number];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function ProjectsFeed() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const filtered =
    activeFilter === "All"
      ? projects
      : projects.filter((p) => p.status === activeFilter);

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
            Real projects, real progress. Follow development happening in LGAs
            nationwide.
          </motion.p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mx-auto mb-10">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={
                activeFilter === f
                  ? "bg-white text-green-700 shadow-sm px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  : "text-slate-500 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-slate-700"
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((project) => (
              <motion.div
                key={project.id}
                variants={cardVariants}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-green-300 transition-all duration-300"
              >
                {/* Icon header */}
                <div
                  className={`h-28 bg-gradient-to-br ${project.iconBg} flex items-center justify-center relative`}
                >
                  <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <project.icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                  </div>
                  {/* Status badge */}
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      project.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : project.status === "Ongoing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="p-4">
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                    {project.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1 mb-1 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {project.lga} LGA, {project.state}
                  </p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${
                          project.status === "Completed"
                            ? "bg-green-500"
                            : project.status === "Ongoing"
                            ? "bg-blue-500"
                            : "bg-amber-400"
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {project.budget}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                        <Heart className="h-3.5 w-3.5" />
                        {project.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {project.comments}
                      </button>
                      <button className="hover:text-green-600 transition-colors">
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom actions */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/projects"
            className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            Explore All Projects →
          </Link>
          <p className="text-xs text-slate-400">
            1,893 projects tracked across 142 LGAs
          </p>
        </div>
      </div>
    </section>
  );
}
