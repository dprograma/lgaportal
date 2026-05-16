"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

const partners = [
  "Federal Ministry of Local Govt.",
  "National Assembly",
  "Nigeria Governors Forum",
  "Open Government Partnership",
  "UNDP Nigeria",
  "World Bank Group",
  "TechCabal",
  "BudgIT Foundation",
  "Paradigm Initiative",
  "OSIWA",
  "MacArthur Foundation",
  "European Union Delegation",
];

const row1 = partners.slice(0, 6);
const row2 = partners.slice(6, 12);

export default function Partners() {
  return (
    <section className="py-16 lg:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-10"
        >
          Supported By &amp; Working With
        </motion.p>

        {/* Row 1 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-4 mb-4"
        >
          {row1.map((partner) => (
            <div
              key={partner}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-green-300 hover:shadow-md transition-all cursor-default"
            >
              <div className="h-5 w-5 rounded bg-green-100 flex items-center justify-center shrink-0">
                <Building2 className="h-3 w-3 text-green-700" />
              </div>
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                {partner}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Row 2 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {row2.map((partner) => (
            <div
              key={partner}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-green-300 hover:shadow-md transition-all cursor-default"
            >
              <div className="h-5 w-5 rounded bg-green-100 flex items-center justify-center shrink-0">
                <Building2 className="h-3 w-3 text-green-700" />
              </div>
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                {partner}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="text-xs text-slate-400 text-center italic"
        >
          Partner logos are representative. Formal partnerships subject to announcement.
        </motion.p>
      </div>
    </section>
  );
}
