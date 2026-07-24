"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Building2, Users, FileText, DollarSign, TrendingUp, Activity } from "lucide-react";

const adminSecret = () => sessionStorage.getItem("adminSecret") ?? "";

interface AnalyticsData {
  lgas: {
    total: number;
    byStatus: Record<string, number>;
    recentSignups: number;
  };
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  posts: { total: number; recent: number };
  revenue: { total: string; transactions: number };
  topLgasByPosts: {
    id: string; lgaName: string; state: string; status: string;
    _count: { posts: number };
  }[];
  monthlyRevenue: { month: string; total: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "#15803d", PENDING: "#d97706",
  SUSPENDED: "#64748b", DEACTIVATED: "#94a3b8", REJECTED: "#dc2626",
};

const ROLE_COLORS: Record<string, string> = {
  CITIZEN: "#2563eb", ADVERTISER: "#9333ea", LGA_CHAIRMAN: "#15803d",
  LGA_STAFF: "#0d9488", ADMIN: "#dc2626",
};

function StatCard({ icon: Icon, label, value, sub, color = "text-green-600" }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function nairaK(koboStr: string) {
  const naira = (koboStr && koboStr !== "0" ? Number(BigInt(koboStr)) : 0) / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000)     return `₦${(naira / 1_000).toFixed(1)}K`;
  return `₦${naira.toFixed(2)}`;
}

export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics", { headers: { "x-admin-secret": adminSecret() } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {[0,1,2].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-slate-400">
        Failed to load analytics.
      </div>
    );
  }

  const lgaStatusData = Object.entries(data.lgas.byStatus).map(([name, value]) => ({ name, value }));
  const userRoleData  = Object.entries(data.users.byRole).map(([name, value]) => ({ name, value }));
  const revenueChartData = data.monthlyRevenue.map((r) => ({
    month: r.month,
    revenue: (r.total && r.total !== "0" ? Number(BigInt(r.total)) : 0) / 100,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-green-600" />
          <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        </div>
        <p className="text-slate-500 text-sm">Real-time overview of platform activity</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2}   label="Total LGAs"      value={data.lgas.total}
          sub={`${data.lgas.byStatus.APPROVED ?? 0} approved`} />
        <StatCard icon={Users}       label="Total Users"     value={data.users.total.toLocaleString()}
          sub={`${data.users.byRole.CITIZEN ?? 0} citizens`} />
        <StatCard icon={FileText}    label="Total Posts"     value={data.posts.total.toLocaleString()}
          sub={`${data.posts.recent} last 30 days`} />
        <StatCard icon={DollarSign}  label="Total Revenue"   value={nairaK(data.revenue.total)}
          sub={`${data.revenue.transactions} transactions`} color="text-green-400" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly revenue bar chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Revenue (₦)</h2>
          {revenueChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChartData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => `₦${(Number(v) / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#0f172a" }}
                  formatter={(v) => [`₦${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#15803d" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* LGA status pie */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">LGA Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={lgaStatusData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={70} label={(entry) => entry.name}>
                {lgaStatusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#0f172a" }}
                formatter={(v, name) => [v, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User role breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">User Breakdown by Role</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {userRoleData.map(({ name, value }) => (
            <div key={name} className="text-center p-3 rounded-xl bg-slate-50">
              <p className="text-xl font-bold text-slate-900">{value.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{name.replace("_", " ")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top LGAs by posts */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-semibold text-slate-700">Top LGAs by Content</h2>
        </div>
        {data.topLgasByPosts.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No data yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.topLgasByPosts.map((lga, idx) => (
              <div key={lga.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-sm font-bold text-green-600/70 w-5 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{lga.lgaName} LGA</p>
                  <p className="text-xs text-slate-400 mt-0.5">{lga.state} · {lga.status}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-green-700">
                  <FileText className="h-3.5 w-3.5 text-green-600/70" />
                  {lga._count.posts}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

