"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, TrendingUp, Megaphone, Clock, DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RevenueData {
  totalRevenue: number;
  byPurpose: { purpose: string; amount: number }[];
  byDay: { date: string; amount: number }[];
  recentTransactions: {
    id: string;
    invoiceNumber?: string;
    amount: string;
    purpose: string;
    status: string;
    createdAt: string;
    paystackRef?: string;
  }[];
  activeCampaigns: number;
  pendingReview: number;
}

const PIE_COLORS = ["#15803d", "#3b82f6", "#8b5cf6", "#f59e0b"];

const purposeLabels: Record<string, string> = {
  AD_CAMPAIGN: "Ad Campaigns",
  LGA_SUBSCRIPTION: "LGA Subscriptions",
  LGA_RENEWAL: "LGA Renewals",
};

const statusColors: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
  REVERSED: "bg-slate-100 text-slate-500",
};

function formatNaira(kobo: number | string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(kobo) / 100
  );
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue", {
      headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "" },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.totalRevenue !== undefined) setData(d);
        else toast.error("Failed to load revenue data");
      })
      .catch(() => toast.error("Failed to load revenue data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.byDay.map((d) => ({
    date: d.date.slice(5), // MM-DD
    revenue: Number(d.amount) / 100,
  }));

  const pieData = data.byPurpose.map((p) => ({
    name: purposeLabels[p.purpose] ?? p.purpose,
    value: Number(p.amount) / 100,
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Revenue Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Financial overview and campaign metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Revenue",
            value: formatNaira(data.totalRevenue),
            icon: DollarSign,
            color: "text-green-700",
            bg: "bg-green-50",
            border: "border-green-100",
          },
          {
            label: "This Month",
            value: formatNaira(
              data.byDay
                .filter((d) => d.date.startsWith(new Date().toISOString().slice(0, 7)))
                .reduce((s, d) => s + d.amount, 0)
            ),
            icon: TrendingUp,
            color: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Active Campaigns",
            value: data.activeCampaigns,
            icon: Megaphone,
            color: "text-purple-700",
            bg: "bg-purple-50",
            border: "border-purple-100",
          },
          {
            label: "Pending Review",
            value: data.pendingReview,
            icon: Clock,
            color: "text-orange-700",
            bg: "bg-orange-50",
            border: "border-orange-100",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} ${stat.border} border rounded-xl p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-slate-800 mb-4">Daily Revenue (Last 30 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(Number(value))
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#15803d"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                name="Revenue (NGN)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Revenue by Purpose</h2>
          {pieData.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No data yet</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatNaira(Number(v) * 100)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 space-y-2">
            {data.byPurpose.map((p, i) => (
              <div key={p.purpose} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-600">{purposeLabels[p.purpose] ?? p.purpose}</span>
                </div>
                <span className="font-semibold text-slate-800">{formatNaira(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Revenue Summary</h2>
          <div className="space-y-3">
            {data.byPurpose.map((p) => {
              const pct =
                data.totalRevenue > 0
                  ? Math.round((p.amount / data.totalRevenue) * 100)
                  : 0;
              return (
                <div key={p.purpose}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{purposeLabels[p.purpose] ?? p.purpose}</span>
                    <span className="font-medium text-slate-800">{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-2 bg-green-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Purpose</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {t.invoiceNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {purposeLabels[t.purpose] ?? t.purpose}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatNaira(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[t.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString("en-NG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
