"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

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

const TABS = ["All", "PENDING_REVIEW", "ACTIVE", "PAUSED", "REJECTED"] as const;
type Tab = (typeof TABS)[number];

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");
  const [updating, setUpdating] = useState<string | null>(null);

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

  const filtered =
    tab === "All" ? campaigns : campaigns.filter((c) => c.status === tab);

  async function toggleStatus(campaign: Campaign) {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setUpdating(campaign.id);
    try {
      const r = await fetch(`/api/advertiser/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: data.campaign.status } : c))
      );
      toast.success(`Campaign ${newStatus === "PAUSED" ? "paused" : "resumed"}`);
    } catch {
      toast.error("Failed to update campaign");
    } finally {
      setUpdating(null);
    }
  }

  const ctr = (c: Campaign) =>
    c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) + "%" : "0%";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all your advertising campaigns</p>
        </div>
        <Link
          href="/advertiser/campaigns/new"
          className="flex items-center gap-2 bg-green-700 text-white font-semibold px-4 py-2 rounded-xl hover:bg-green-800 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t
                ? "bg-green-700 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "All" ? "All" : t.replace(/_/g, " ")}
            <span className="ml-1.5 text-xs opacity-70">
              ({t === "All" ? campaigns.length : campaigns.filter((c) => c.status === t).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
          No campaigns found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 min-w-[200px]">Campaign</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Format</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Placement</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Impressions</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Clicks</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">CTR</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Start/End</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[180px]">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.plan?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.format}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.placement.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[c.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{c.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{c.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{ctr(c)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString("en-NG") : "—"}
                      <br />
                      {c.endDate ? new Date(c.endDate).toLocaleDateString("en-NG") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {(c.status === "ACTIVE" || c.status === "PAUSED") && (
                          <button
                            onClick={() => toggleStatus(c)}
                            disabled={updating === c.id}
                            className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                              c.status === "ACTIVE"
                                ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {updating === c.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : c.status === "ACTIVE" ? (
                              "Pause"
                            ) : (
                              "Resume"
                            )}
                          </button>
                        )}
                        <Link
                          href={`/advertiser/campaigns/${c.id}`}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
