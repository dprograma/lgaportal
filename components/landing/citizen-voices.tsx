"use client";

import { motion } from "framer-motion";
import { MessageSquare, Star, CheckCircle2, Trophy } from "lucide-react";

const voices = [
  {
    name: "Amaka Okonkwo",
    lga: "Enugu North",
    state: "Enugu",
    text: "I reported a broken streetlight on the portal and it was fixed within 2 weeks. This platform actually works!",
    avatar: "AO",
    rating: 5,
    action: "Issue Reported",
  },
  {
    name: "Biodun Adeyemi",
    lga: "Ikeja",
    state: "Lagos",
    text: "Finally I can see where our LGA allocation money is going. The transparency reports are eye-opening.",
    avatar: "BA",
    rating: 5,
    action: "Viewed Allocations",
  },
  {
    name: "Musa Ibrahim",
    lga: "Kano Municipal",
    state: "Kano",
    text: "Our chairman now updates project progress weekly because citizens are watching. Real accountability!",
    avatar: "MI",
    rating: 4,
    action: "Project Tracked",
  },
  {
    name: "Ngozi Eze",
    lga: "Udi",
    state: "Enugu",
    text: "I nominated my LGA and they registered within a month. Now we can track our road construction project.",
    avatar: "NE",
    rating: 5,
    action: "LGA Nominated",
  },
  {
    name: "Emeka Obi",
    lga: "Gwale",
    state: "Kano",
    text: "The community polls feature helped our LGA decide on building a health centre vs. road repairs. Citizens won!",
    avatar: "EO",
    rating: 4,
    action: "Poll Voted",
  },
  {
    name: "Fatima Sule",
    lga: "Port Harcourt City",
    state: "Rivers",
    text: "Shared a project completion report with my community WhatsApp group. Everyone is now on the platform.",
    avatar: "FS",
    rating: 5,
    action: "Report Shared",
  },
];

export default function CitizenVoices() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-widest mb-5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Citizen Voices
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
          >
            What Citizens Are Saying
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Real feedback from Nigerians using the platform to hold their local governments accountable.
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {voices.map((voice, index) => (
            <motion.div
              key={voice.name}
              whileHover={{ y: -3 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: voice.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-slate-700 leading-relaxed mb-4 italic">
                &ldquo;{voice.text}&rdquo;
              </p>

              {/* Action badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold mb-4">
                <CheckCircle2 className="h-3 w-3" />
                {voice.action}
              </span>

              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {voice.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{voice.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {voice.lga} LGA, {voice.state}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Citizen of the Month spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 bg-gradient-to-r from-green-800 to-green-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-black shrink-0">
            AO
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                Citizen of the Month · March 2025
              </span>
            </div>
            <h3 className="text-white text-lg font-bold mb-1">Amaka Okonkwo</h3>
            <p className="text-green-200 text-sm">
              Enugu North LGA, Enugu State · 23 issues reported · 8 resolved
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { v: "23", l: "Reports Filed" },
              { v: "8", l: "Issues Resolved" },
              { v: "4.9★", l: "Community Rating" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-white text-xl font-bold">{s.v}</p>
                <p className="text-green-300 text-[10px]">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
