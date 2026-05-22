"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, FolderOpen, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";

interface LGA {
  name: string;
  state: string;
  zone: string;
  chairman: string;
  projects: number;
  engagement: number;
  status: string;
  verified: boolean;
}

const lgas: LGA[] = [
  { name: "Lagos Island", state: "Lagos", zone: "South West", chairman: "Hon. Desmond Elliot", projects: 24, engagement: 92, status: "Active", verified: true },
  { name: "Ikeja", state: "Lagos", zone: "South West", chairman: "Hon. Mojeed Balogun", projects: 18, engagement: 87, status: "Active", verified: true },
  { name: "Kano Municipal", state: "Kano", zone: "North West", chairman: "Hon. Kabir Aliyu", projects: 31, engagement: 78, status: "Active", verified: true },
  { name: "Enugu North", state: "Enugu", zone: "South East", chairman: "Hon. Chukwuemeka Eze", projects: 15, engagement: 84, status: "Active", verified: true },
  { name: "Port Harcourt City", state: "Rivers", zone: "South South", chairman: "Hon. Saki Enoch", projects: 22, engagement: 89, status: "Active", verified: true },
  { name: "Gwale", state: "Kano", zone: "North West", chairman: "Hon. Musa Rogo", projects: 9, engagement: 71, status: "Recently Joined", verified: false },
  { name: "Udi", state: "Enugu", zone: "South East", chairman: "Hon. Emmanuel Ugwu", projects: 7, engagement: 65, status: "Recently Joined", verified: false },
  { name: "Ibeju-Lekki", state: "Lagos", zone: "South West", chairman: "Not Listed", projects: 0, engagement: 0, status: "Not Yet Registered", verified: false },
];

const statuses = ["All", "Active", "Recently Joined", "Not Yet Registered"];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function ExploreLGAs() {
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [activeStatus, setActiveStatus] = useState("All");

  const filtered = lgas.filter((lga) => {
    const stateMatch = selectedState === "All States" || lga.state === selectedState;
    const zoneMatch = selectedZone === "All Zones" || lga.zone === selectedZone;
    const statusMatch = activeStatus === "All" || lga.status === activeStatus;
    return stateMatch && zoneMatch && statusMatch;
  });

  return (
    <section id="explore" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
            Explore LGAs
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Browse All 774 LGAs</h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Find your local government and see what they're building.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {/* State dropdown */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500"
          >
            <option>All States</option>
            {[
              "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
              "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
              "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
              "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
              "Yobe", "Zamfara",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          {/* Zone dropdown */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-green-500"
          >
            <option>All Zones</option>
            {["North Central", "North East", "North West", "South East", "South South", "South West"].map(
              (z) => (
                <option key={z}>{z}</option>
              )
            )}
          </select>

          {/* Status filters */}
          {statuses.map((s) => (
            <button
              key={s}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStatus === s
                  ? "bg-green-700 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-green-400"
              }`}
              onClick={() => setActiveStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* LGA Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {filtered.map((lga) => (
            <motion.div
              key={lga.name}
              variants={cardVariants}
              whileHover={{ y: -3 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Colored top bar */}
              <div
                className={`h-1.5 ${
                  lga.status === "Active"
                    ? "bg-gradient-to-r from-green-600 to-green-400"
                    : lga.status === "Recently Joined"
                    ? "bg-gradient-to-r from-amber-500 to-amber-300"
                    : "bg-slate-200"
                }`}
              />
              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                    {lga.name.charAt(0)}
                  </div>
                  {lga.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-0.5">{lga.name} LGA</h3>
                <p className="text-xs text-slate-500 mb-3">
                  {lga.state} State · {lga.zone}
                </p>

                {lga.projects > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {lga.projects} projects
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {lga.engagement}% engaged
                      </span>
                    </div>
                    {/* Engagement bar */}
                    <div className="h-1.5 bg-slate-100 rounded-full mb-4">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${lga.engagement}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">Chairman: {lga.chairman}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-4">Not yet registered on platform</p>
                )}

                {lga.projects > 0 && (
                  <Link
                    href={`/lgas/${lga.name.toLowerCase().replace(/ /g, "-")}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-50 hover:bg-green-700 hover:text-white text-slate-700 border border-slate-200 hover:border-green-700"
                  >
                    <Eye className="h-3 w-3" />
                    View Profile
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom actions */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/lgas"
            className="px-7 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            View All LGAs →
          </Link>
          <p className="text-xs text-slate-400">
            774 LGAs total · 142 active on platform · 632 yet to register
          </p>
        </div>
      </div>
    </section>
  );
}
