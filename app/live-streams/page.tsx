"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Radio, CalendarDays, Building2, ExternalLink,
  Loader2, Clock, Wifi,
} from "lucide-react";

type StreamStatus = "UPCOMING" | "LIVE" | "ENDED";

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string;
  scheduledAt: string;
  status: StreamStatus;
  lga: { lgaName: string; state: string } | null;
}

function StatusBadge({ status }: { status: StreamStatus }) {
  if (status === "LIVE") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      Live Now
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
      <Clock className="h-3 w-3" />
      Upcoming
    </span>
  );
}

function StreamCard({ stream }: { stream: LiveStream }) {
  const scheduled = new Date(stream.scheduledAt);
  const isLive    = stream.status === "LIVE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
        isLive ? "border-red-200 ring-1 ring-red-200" : "border-slate-100"
      }`}
    >
      {/* Header strip */}
      <div className={`h-1.5 ${isLive ? "bg-red-500" : "bg-gradient-to-r from-green-700 to-green-500"}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={stream.status} />
          {stream.lga && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Building2 className="h-3 w-3" />
              {stream.lga.lgaName}, {stream.lga.state}
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2">{stream.title}</h3>

        {stream.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{stream.description}</p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <CalendarDays className="h-3.5 w-3.5" />
          {scheduled.toLocaleDateString("en-NG", {
            weekday: "short", day: "numeric", month: "short", year: "numeric",
          })}
          {" · "}
          {scheduled.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
        </div>

        <a
          href={stream.streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isLive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-700 hover:bg-green-800 text-white"
          }`}
        >
          {isLive ? <Wifi className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
          {isLive ? "Watch Live" : "Set Reminder"}
        </a>
      </div>
    </motion.div>
  );
}

export default function LiveStreamsPage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live-streams")
      .then((r) => r.json())
      .then((d) => setStreams(d.streams ?? []))
      .finally(() => setLoading(false));
  }, []);

  const live     = streams.filter((s) => s.status === "LIVE");
  const upcoming = streams.filter((s) => s.status === "UPCOMING");

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero */}
      <div className="bg-[#071a0e] text-white px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-green-300 text-xs mb-6 hover:text-white transition-colors">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Radio className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Live Streams</h1>
              <p className="text-green-300/70 text-sm">
                Watch live broadcasts and town-hall sessions from LGAs across Nigeria
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : streams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <Radio className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-700 font-semibold mb-1">No streams scheduled right now</p>
            <p className="text-slate-400 text-sm">Check back soon — LGAs will announce upcoming live sessions here.</p>
            <Link href="/news" className="inline-block mt-4 text-sm text-green-700 font-semibold hover:underline">
              Browse press releases instead →
            </Link>
          </div>
        ) : (
          <>
            {/* Live now */}
            {live.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Happening Now
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {live.map((s) => <StreamCard key={s.id} stream={s} />)}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Upcoming Streams
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcoming.map((s) => <StreamCard key={s.id} stream={s} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
