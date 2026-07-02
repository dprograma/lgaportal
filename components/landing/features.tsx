"use client";

import { motion } from "framer-motion";
import { BarChart2, MessageSquare, Map, Gem, Handshake, Trophy } from "lucide-react";

const features = [
  {
    icon: Gem,
    title: "Global Endowment Showcase",
    description:
      "LGAs list their mineral resources, fertile farmland, livestock zones, fisheries, and energy potential — visible to investors, developers, and partners worldwide.",
    highlight: true,
  },
  {
    icon: Handshake,
    title: "Investor Matchmaking Hub",
    description:
      "Verified investors browse LGA profiles by sector and submit interest directly. We connect them to LGA administrations ready to partner — no middlemen.",
    highlight: true,
  },
  {
    icon: Trophy,
    title: "Performance Recognition",
    description:
      "LGAs with strong delivery records are ranked, praised, and elevated on the platform. Good governance becomes a competitive advantage that attracts even more investment.",
    highlight: true,
  },
  {
    icon: BarChart2,
    title: "Federal Allocation Data",
    description:
      "Transparent, up-to-date data on FAAC allocations to every LGA — monthly, quarterly, and annually — building investor confidence through financial visibility.",
  },
  {
    icon: Map,
    title: "Real-time Project Tracking",
    description:
      "Monitor ongoing infrastructure and development projects across your LGA with live status updates, milestones, and citizen-verified completion reports.",
  },
  {
    icon: MessageSquare,
    title: "Citizen Engagement",
    description:
      "Citizens submit reports, vote on community priorities, and communicate directly with their LGA — building the community trust that investors look for.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4"
          >
            What the Platform Delivers
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight"
          >
            Built to{" "}
            <span className="text-green-700">Grow LGAs</span>
            {", "}
            Attract Investment &amp; Empower Citizens
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Three powerful audiences — LGA administrators, Nigerian citizens, and global
            investors — each getting real, measurable value from one integrated platform.
          </motion.p>
        </div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map(({ icon: Icon, title, description, highlight }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`group rounded-xl border p-6 cursor-default transition-shadow duration-300 ${
                highlight
                  ? "bg-white border-green-200 shadow-md hover:shadow-glow hover:border-green-400"
                  : "bg-white border-slate-100 shadow-card hover:shadow-glow"
              }`}
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                highlight ? "bg-green-700 group-hover:bg-green-800" : "bg-green-50 group-hover:bg-green-100"
              }`}>
                <Icon className={`h-5 w-5 ${highlight ? "text-white" : "text-green-600"}`} />
              </div>
              {highlight && (
                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                  LGA Benefit
                </span>
              )}
              <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
