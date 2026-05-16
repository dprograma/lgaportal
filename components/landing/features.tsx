"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  BarChart2,
  MessageSquare,
  Map,
  Brain,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Real-time Project Tracking",
    description:
      "Monitor ongoing infrastructure and development projects across your LGA with live status updates and milestones.",
  },
  {
    icon: BarChart2,
    title: "Federal Allocation Data",
    description:
      "Access transparent, up-to-date data on federal allocations to every LGA — monthly, quarterly, and annually.",
  },
  {
    icon: MessageSquare,
    title: "Citizen Engagement",
    description:
      "Submit reports, vote on community priorities, and communicate directly with your elected representatives.",
  },
  {
    icon: Map,
    title: "Interactive Nigeria Map",
    description:
      "Explore governance metrics and project statuses visually across all 36 states and 774 LGAs on an interactive map.",
  },
  {
    icon: Brain,
    title: "AI Sentiment Analysis",
    description:
      "Our AI analyses citizen feedback and social signals to surface community concerns before they escalate.",
  },
  {
    icon: Shield,
    title: "Transparent Governance",
    description:
      "Every action, allocation, and decision is logged immutably — ensuring accountability at every level of local government.",
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
    <section className="py-20 lg:py-28 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4"
          >
            Platform Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight"
          >
            Everything You Need to Monitor{" "}
            <span className="gradient-text">Local Governance</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Built specifically for Nigerian citizens and LGA administrators —
            powerful tools that make government accountability simple and
            accessible.
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
          {features.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group bg-white rounded-xl shadow-card border border-slate-100 p-6 cursor-default hover:shadow-glow transition-shadow duration-300"
            >
              <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <Icon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
