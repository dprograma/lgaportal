"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
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
  description?: string;
  format: string;
  placement: string;
  status: string;
  impressions: number;
  clicks: number;
  linkUrl: string;
  creativeUrl?: string;
  startDate?: string;
  endDate?: string;
  plan: { name: string; price: string; durationDays: number };
}

interface DailyStat {
  date: string;
  impressions: number;
  clicks: number;
}

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-600",
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCreativeUrl, setEditCreativeUrl] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");

  useEffect(() => {
    fetch(`/api/advertiser/campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.campaign) {
          setCampaign(data.campaign);
          setDailyStats(data.dailyStats ?? []);
          setEditTitle(data.campaign.title);
          setEditDesc(data.campaign.description ?? "");
          setEditCreativeUrl(data.campaign.creativeUrl ?? "");
          setEditLinkUrl(data.campaign.linkUrl);
        } else {
          toast.error("Campaign not found");
          router.push("/advertiser/campaigns");
        }
      })
      .catch(() => {
        toast.error("Failed to load campaign");
        router.push("/advertiser/campaigns");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function saveEdits() {
    setSaving(true);
    try {
      const r = await fetch(`/api/advertiser/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          creativeUrl: editCreativeUrl,
          linkUrl: editLinkUrl,
        }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setCampaign((prev) => prev ? { ...prev, ...data.campaign } : prev);
      setEditing(false);
      toast.success("Campaign updated");
    } catch {
      toast.error("Failed to update campaign");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!campaign) return;
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setToggling(true);
    try {
      const r = await fetch(`/api/advertiser/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setCampaign((prev) => prev ? { ...prev, status: data.campaign.status } : prev);
      toast.success(`Campaign ${newStatus === "PAUSED" ? "paused" : "resumed"}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  }

  function downloadCSV() {
    if (!campaign) return;
    const rows = [
      ["Date", "Impressions", "Clicks"],
      ...dailyStats.map((d) => [d.date, d.impressions, d.clicks]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${id}-performance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!campaign) return null;

  const ctr =
    campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) + "%"
      : "0%";

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/advertiser/campaigns"
          className="text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{campaign.title}</h1>
          <p className="text-slate-500 text-sm">{campaign.plan?.name}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
            statusColors[campaign.status] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {campaign.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-medium text-blue-500 mb-1">Impressions</p>
          <p className="text-2xl font-bold text-blue-700">
            {campaign.impressions.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-xs font-medium text-purple-500 mb-1">Clicks</p>
          <p className="text-2xl font-bold text-purple-700">
            {campaign.clicks.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs font-medium text-green-500 mb-1">CTR</p>
          <p className="text-2xl font-bold text-green-700">{ctr}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Daily Performance (Last 30 Days)</h2>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="clicks" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Campaign Settings</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-green-600 hover:underline font-medium"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-slate-500 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
            {editing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            ) : (
              <p className="text-sm text-slate-800">{campaign.title}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            {editing ? (
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              />
            ) : (
              <p className="text-sm text-slate-600">{campaign.description || "—"}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Destination URL</label>
            {editing ? (
              <input
                type="url"
                value={editLinkUrl}
                onChange={(e) => setEditLinkUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            ) : (
              <a href={campaign.linkUrl} className="text-sm text-green-600 hover:underline break-all">
                {campaign.linkUrl}
              </a>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Creative URL</label>
            {editing ? (
              <input
                type="url"
                value={editCreativeUrl}
                onChange={(e) => setEditCreativeUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            ) : (
              <p className="text-sm text-slate-600">{campaign.creativeUrl || "No creative image"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status control */}
      {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Campaign Status</h2>
          <p className="text-sm text-slate-500 mb-4">
            {campaign.status === "ACTIVE"
              ? "Your campaign is currently running. Pause it to temporarily stop showing ads."
              : "Your campaign is paused. Resume to start showing ads again."}
          </p>
          <button
            onClick={toggleStatus}
            disabled={toggling}
            className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-colors ${
              campaign.status === "ACTIVE"
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-green-700 hover:bg-green-800 text-white"
            }`}
          >
            {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
            {campaign.status === "ACTIVE" ? "Pause Campaign" : "Resume Campaign"}
          </button>
        </div>
      )}
    </div>
  );
}
