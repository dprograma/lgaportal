"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarClock, Clock, X, Newspaper } from "lucide-react";
import { toast } from "sonner";

function getLgaId(): string {
  return typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : "";
}

interface ScheduledPost {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  createdAt: string;
}

export default function ScheduledPostsPage() {
  const [posts,   setPosts]   = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string | null>(null);

  const load = useCallback(async () => {
    const lgaId = getLgaId();
    if (!lgaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        "/api/lga-dashboard/posts?status=DRAFT&scheduled=true",
        { headers: { "x-lga-id": lgaId } }
      );
      const data = await res.json();
      // Filter to only posts with a future scheduledAt
      const scheduled = (data.posts ?? []).filter(
        (p: ScheduledPost) => p.scheduledAt && new Date(p.scheduledAt) > new Date()
      );
      setPosts(scheduled);
    } catch {
      toast.error("Failed to load scheduled posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearSchedule = async (postId: string) => {
    const lgaId = getLgaId();
    setActing(postId);
    try {
      const res = await fetch(`/api/lga-dashboard/posts/schedule?postId=${postId}`, {
        method: "DELETE",
        headers: { "x-lga-id": lgaId },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Schedule cleared.");
      load();
    } catch {
      toast.error("Failed to clear schedule.");
    } finally {
      setActing(null);
    }
  };

  function timeUntil(date: string) {
    const ms = new Date(date).getTime() - Date.now();
    if (ms <= 0) return "Due now";
    const hours = Math.floor(ms / 3_600_000);
    const days  = Math.floor(hours / 24);
    if (days > 0) return `in ${days} day${days !== 1 ? "s" : ""}`;
    return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-5 w-5 text-green-700" />
            <h1 className="text-2xl font-bold text-slate-900">Scheduled Posts</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Posts queued for future publishing. They remain as drafts until published manually or via scheduler.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2].map((i) => (
              <div key={i} className="h-16 px-5 flex items-center gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-56" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <Newspaper className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No scheduled posts</p>
            <p className="text-slate-400 text-xs mt-1">
              Schedule a post from the Posts &amp; Updates section.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-4">
                <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{post.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scheduled for{" "}
                    <span className="text-amber-600 font-medium">
                      {new Date(post.scheduledAt).toLocaleString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>{" "}
                    · <span className="text-slate-500">{timeUntil(post.scheduledAt)}</span>
                  </p>
                </div>
                <button
                  onClick={() => clearSchedule(post.id)}
                  disabled={acting === post.id}
                  title="Clear schedule"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
