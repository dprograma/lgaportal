"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Eye, ThumbsUp, MessageSquare, FileText, Users } from "lucide-react";

function getLgaId(): string {
  return typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : "";
}

interface Analytics {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    archivedPosts: number;
    recentPosts: number;
    totalViews: number;
    totalReactions: number;
    totalComments: number;
  };
  topPosts: {
    id: string;
    title: string;
    viewCount: number;
    createdAt: string;
    _count: { reactions: number; comments: number };
  }[];
  reactionBreakdown: { type: string; count: number }[];
  dailyActivity: { date: string; posts: number; views: number }[];
}

const REACTION_COLORS: Record<string, string> = {
  LIKE: "#15803d", DISLIKE: "#dc2626", SUPPORT: "#2563eb",
  QUESTION: "#d97706", REPORT: "#9333ea",
};

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-green-700" />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function LGAAnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lgaId = getLgaId();
    if (!lgaId) { setLoading(false); return; }
    fetch("/api/lga-dashboard/analytics", { headers: { "x-lga-id": lgaId } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {[0,1,2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-slate-500">
        Failed to load analytics.
      </div>
    );
  }

  const { overview, topPosts, reactionBreakdown, dailyActivity } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Performance overview for your LGA portal</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText}     label="Total Posts"     value={overview.totalPosts}     sub={`${overview.publishedPosts} published`} />
        <StatCard icon={Eye}          label="Total Views"     value={overview.totalViews.toLocaleString()} sub="across all posts" />
        <StatCard icon={ThumbsUp}     label="Total Reactions" value={overview.totalReactions.toLocaleString()} sub="likes, supports & more" />
        <StatCard icon={MessageSquare} label="Comments"       value={overview.totalComments.toLocaleString()} sub="citizen engagement" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{overview.publishedPosts}</p>
          <p className="text-xs text-slate-400 mt-1">Published</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{overview.draftPosts}</p>
          <p className="text-xs text-slate-400 mt-1">Drafts</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-500">{overview.archivedPosts}</p>
          <p className="text-xs text-slate-400 mt-1">Archived</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Daily activity line chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Posts & Views (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyActivity} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
                interval={6} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                labelFormatter={(v) => new Date(String(v)).toLocaleDateString("en-NG")}
                formatter={(v, name) => [v, name === "posts" ? "Posts" : "Views"]}
              />
              <Line type="monotone" dataKey="posts" stroke="#15803d" strokeWidth={2} dot={false} name="posts" />
              <Line type="monotone" dataKey="views" stroke="#93c5fd" strokeWidth={2} dot={false} name="views" />
              <Legend formatter={(v) => v === "posts" ? "Posts" : "Views"} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reaction breakdown pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Reaction Breakdown</h2>
          {reactionBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              No reactions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={reactionBreakdown} dataKey="count" nameKey="type"
                  cx="50%" cy="50%" outerRadius={70} label={((entry: { type?: string }) => entry.type ?? "") as any}>
                  {reactionBreakdown.map((entry) => (
                    <Cell key={entry.type} fill={REACTION_COLORS[entry.type] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top posts */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-700" />
          <h2 className="text-sm font-semibold text-slate-700">Top Posts by Views</h2>
        </div>
        {topPosts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No published posts yet</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {topPosts.map((post, idx) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-xs font-bold text-slate-300 w-5 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{post.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(post.createdAt).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {post.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" /> {post._count.reactions}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {post._count.comments}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
