"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Megaphone, TrendingUp, Eye, MousePointer, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Campaign {
  id: string;
  title: string;
  format: string;
  placement: string;
  status: string;
  impressions: number;
  clicks: number;
  startDate?: string;
  endDate?: string;
  plan: { name: string };
}

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export default function AdvertiserDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/advertiser/campaigns")
      .then((r) => r.json())
      .then((data) => {
        if (data.campaigns) setCampaigns(data.campaigns);
        else toast.error("Failed to load campaigns");
      })
      .catch(() => toast.error("Failed to load campaigns"))
      .finally(() => setLoading(false));
  }, []);

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;

  // Build last-30-day chart data from campaigns (rough estimate)
  const chartData: { date: string; impressions: number; clicks: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    chartData.push({
      date: d.toISOString().split("T")[0].slice(5),
      impressions: 0,
      clicks: 0,
    });
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Advertiser Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your advertising activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Campaigns",
            value: campaigns.length,
            icon: Megaphone,
            color: "text-slate-700",
            bg: "bg-slate-50",
          },
          {
            label: "Active Campaigns",
            value: activeCampaigns,
            icon: TrendingUp,
            color: "text-green-700",
            bg: "bg-green-50",
          },
          {
            label: "Total Impressions",
            value: totalImpressions.toLocaleString(),
            icon: Eye,
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            label: "Total Clicks",
            value: totalClicks.toLocaleString(),
            icon: MousePointer,
            color: "text-purple-700",
            bg: "bg-purple-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-xl p-4 border border-slate-100`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{loading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-slate-800 mb-4">Performance (Last 30 Days)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="#15803d"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Campaigns</h2>
          <Link
            href="/advertiser/campaigns/new"
            className="text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
          >
            New Campaign
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            No campaigns yet.{" "}
            <Link href="/advertiser/campaigns/new" className="text-green-600 hover:underline">
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Campaign</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Impressions</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Clicks</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[180px]">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-400">{c.plan?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[c.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {c.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {c.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/advertiser/campaigns/${c.id}`}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
