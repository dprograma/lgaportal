"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Plus, Trash2, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";

const ADMIN_SECRET = typeof window !== "undefined" ? (sessionStorage.getItem("adminSecret") ?? "") : "";

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

const STATUS_META: Record<StreamStatus, { label: string; color: string }> = {
  UPCOMING: { label: "Upcoming",  color: "bg-amber-100 text-amber-700"   },
  LIVE:     { label: "Live Now",  color: "bg-red-100 text-red-700"       },
  ENDED:    { label: "Ended",     color: "bg-slate-100 text-slate-500"   },
};

function Countdown({ to }: { to: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const target = new Date(to).getTime();
    const update = () => setDiff(Math.max(0, target - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [to]);
  if (diff <= 0) return <span className="text-red-500 text-xs font-bold">Now</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const d = Math.floor(h / 24);
  if (d > 0) return <span className="text-xs text-slate-500">{d}d {h % 24}h away</span>;
  return <span className="text-xs font-mono text-amber-600">{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}</span>;
}

export default function AdminLiveStreamsPage() {
  const [streams,  setStreams]  = useState<LiveStream[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", streamUrl: "", scheduledAt: "", lgaId: "",
  });
  const [lgaSearch,  setLgaSearch]  = useState("");
  const [lgaOptions, setLgaOptions] = useState<{ id: string; lgaName: string; state: string }[]>([]);

  const fetchStreams = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/live-streams", { headers: { "x-admin-secret": ADMIN_SECRET } });
      const data = await res.json();
      setStreams(data.streams ?? []);
    } catch { toast.error("Failed to load streams."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStreams(); }, [fetchStreams]);

  useEffect(() => {
    if (lgaSearch.length < 2) { setLgaOptions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/lgas?limit=10&search=${encodeURIComponent(lgaSearch)}&status=APPROVED`, { headers: { "x-admin-secret": ADMIN_SECRET } });
      const data = await res.json();
      setLgaOptions(data.lgas ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [lgaSearch]);

  const setStatus = async (id: string, status: StreamStatus) => {
    setActing(id);
    try {
      await fetch(`/api/admin/live-streams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ status }),
      });
      fetchStreams();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const deleteStream = async (id: string) => {
    if (!confirm("Delete this live stream?")) return;
    setActing(id);
    try {
      await fetch(`/api/admin/live-streams/${id}`, { method: "DELETE", headers: { "x-admin-secret": ADMIN_SECRET } });
      toast.success("Deleted.");
      fetchStreams();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  const createStream = async () => {
    if (!form.title || !form.streamUrl || !form.scheduledAt) {
      toast.error("Title, stream URL, and scheduled time are required."); return;
    }
    try {
      const res = await fetch("/api/admin/live-streams", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ ...form, lgaId: form.lgaId || undefined }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Live stream scheduled.");
      setShowForm(false);
      setForm({ title: "", description: "", streamUrl: "", scheduledAt: "", lgaId: "" });
      setLgaSearch("");
      fetchStreams();
    } catch { toast.error("Failed."); }
  };

  const liveCount = streams.filter((s) => s.status === "LIVE").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-5 w-5 text-green-400" />
            <h1 className="text-2xl font-bold text-white">Live Streams</h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> {liveCount} LIVE
              </span>
            )}
          </div>
          <p className="text-green-200/60 text-sm">{streams.length} total streams</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">
          <Plus className="h-4 w-4" /> Schedule Stream
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2].map((i) => <div key={i} className="h-16 px-6 flex items-center animate-pulse"><div className="h-4 bg-slate-100 rounded w-full" /></div>)}
          </div>
        ) : streams.length === 0 ? (
          <div className="py-20 text-center">
            <Radio className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No live streams scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {streams.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <div key={s.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.title}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.color}`}>{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(s.scheduledAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
                      {s.status === "UPCOMING" && <Countdown to={s.scheduledAt} />}
                      {s.lga && <span>{s.lga.lgaName} LGA</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.status === "UPCOMING" && (
                      <button onClick={() => setStatus(s.id, "LIVE")} disabled={acting === s.id}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors disabled:opacity-40">
                        Go Live
                      </button>
                    )}
                    {s.status === "LIVE" && (
                      <button onClick={() => setStatus(s.id, "ENDED")} disabled={acting === s.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors disabled:opacity-40">
                        End Stream
                      </button>
                    )}
                    <a href={s.streamUrl} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button onClick={() => deleteStream(s.id)} disabled={acting === s.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Schedule Live Stream</h3>
                  <p className="text-xs text-slate-500">Appears as countdown on the public News page</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Event Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. LGA Town Hall â€” Ward 4 Water Project Launch"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Stream URL * <span className="font-normal text-slate-400">(YouTube Live, etc.)</span></label>
                  <input type="url" value={form.streamUrl} onChange={(e) => setForm((f) => ({ ...f, streamUrl: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=â€¦"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Scheduled Date & Time *</label>
                  <input type="datetime-local" value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Description (optional)</label>
                  <textarea rows={3} value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the eventâ€¦"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 resize-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Link to LGA (optional)</label>
                  {form.lgaId ? (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-green-300 bg-green-50">
                      <p className="text-sm text-green-800">{lgaSearch}</p>
                      <button onClick={() => { setForm((f) => ({ ...f, lgaId: "" })); setLgaSearch(""); }}
                        className="text-xs text-slate-400 hover:text-red-500">Clear</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="text" placeholder="Search LGAâ€¦" value={lgaSearch}
                        onChange={(e) => setLgaSearch(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
                      {lgaOptions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-36 overflow-y-auto">
                          {lgaOptions.map((lga) => (
                            <button key={lga.id} onClick={() => { setForm((f) => ({ ...f, lgaId: lga.id })); setLgaSearch(`${lga.lgaName} LGA, ${lga.state}`); setLgaOptions([]); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 border-b border-slate-50 last:border-0">
                              {lga.lgaName} LGA â€” {lga.state}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">Cancel</button>
                  <button onClick={createStream}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold">Schedule</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
