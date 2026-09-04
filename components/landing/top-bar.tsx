"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/lib/use-current-user";

interface Announcement {
  text: string;
  href?: string;
}

const FALLBACK_ANNOUNCEMENTS: Announcement[] = [
  { text: "📊 774 LGAs tracked — Join the transparency movement" },
];

export default function TopBar() {
  const [index, setIndex] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>(FALLBACK_ANNOUNCEMENTS);
  const user = useCurrentUser();

  useEffect(() => {
    fetch("/api/public/activity")
      .then((r) => r.json())
      .then((data: { feed?: { text: string; href: string }[] }) => {
        if (data.feed && data.feed.length > 0) {
          setAnnouncements(data.feed.map((item) => ({ text: `🔔 ${item.text}`, href: item.href })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements]);

  const current = announcements[index] ?? announcements[0];

  return (
    <div className="w-full bg-[#0f2d1a] z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
        {/* Left: Nigerian flag + text */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5">
            <span className="w-3 h-4 rounded-sm bg-[#008751] inline-block" />
            <span className="w-3 h-4 rounded-sm bg-white inline-block" />
            <span className="w-3 h-4 rounded-sm bg-[#008751] inline-block" />
          </div>
          <span className="hidden sm:inline text-[11px] text-green-300 font-semibold uppercase tracking-widest">
            Federal Republic of Nigeria
          </span>
        </div>

        {/* Center: Rotating ticker (hidden on mobile) */}
        <div className="hidden sm:flex flex-1 items-center justify-center overflow-hidden h-full">
          <AnimatePresence mode="wait">
            {current.href ? (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <Link
                  href={current.href}
                  className="text-[11px] text-green-200 hover:text-white text-center whitespace-nowrap no-underline transition-colors"
                >
                  {current.text}
                </Link>
              </motion.div>
            ) : (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-[11px] text-green-200 text-center whitespace-nowrap"
              >
                {current.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Navigation links */}
        <div className="flex items-center gap-2 shrink-0">
          {user.authenticated ? (
            /* Authenticated: no Sign In / Join Free — offer a dashboard shortcut */
            user.dashboardHref && (
              <Link
                href={user.dashboardHref}
                className="text-[11px] text-green-300 hover:text-white font-semibold transition-colors"
              >
                My Dashboard →
              </Link>
            )
          ) : (
            <>
              <Link
                href="/lga-signup"
                className="hidden sm:inline text-[11px] text-green-300 hover:text-white font-semibold transition-colors"
              >
                Register Your LGA →
              </Link>
              <span className="hidden sm:inline text-green-700 text-[11px]">|</span>
              <Link
                href="/login"
                className="text-[11px] text-green-300 hover:text-white font-semibold transition-colors"
              >
                Sign In
              </Link>
              <span className="text-green-700 text-[11px]">|</span>
              <Link
                href="/signup"
                className="text-[11px] text-green-300 hover:text-white font-semibold transition-colors"
              >
                Join Free
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
