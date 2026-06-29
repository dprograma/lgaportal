"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Plus, Pencil, Trash2 } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  format: string;
  placement: string;
  status: string;
  impressions: number;
  clicks: number;
  creativeUrl?: string;
  linkUrl: string;
  rejectionReason?: string;
  createdAt: string;
  advertiser: { id: string; name: string; email: string };
  plan: { name: string; price: string };
}

interface AdPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  durationDays: number;
  formats: string[];
  placements: string[];
  isActive: boolean;
  sortOrder: number;
}

const adminHeaders = { "x-admin-secret": typeof window !== "undefined" ? (sessionStorage.getItem("adminSecret") ?? "") : "" };

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-600",
};

function formatNaira(kobo: string | number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(kobo) / 100
  );
}

type Tab = "pending" | "all" | "plans";

export default function AdminAdsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [plans, setPlans] = useState<AdPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Plan form state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: "30",
    formats: "BANNER",
    placements: "HOMEPAGE_TOP",
    maxImpressions: "",
    sortOrder: "0",
  });

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (tab === "plans") {
        const r = await fetch("/api/admin/ad-plans", { headers: adminHeaders });
        const data = await r.json();
        if (data.plans) setPlans(data.plans);
      } else {
        const status = tab === "pending" ? "PENDING_REVIEW" : undefined;
        const url = status
          ? `/api/admin/ads?status=${status}&page=1`
          : "/api/admin/ads?page=1";
        const r = await fetch(url, { headers: adminHeaders });
        const data = await r.json();
        if (data.campaigns) setCampaigns(data.campaigns);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function approveCampaign(id: string) {
    setActionId(id);
    try {
      const r = await fetch(`/api/admin/ads/${id}/approve`, {
        method: "POST",
        headers: adminHeaders,
      });
      if (!r.ok) throw new Error();
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" } : c))
      );
      toast.success("Campaign approved");
    } catch {
      toast.error("Failed to approve campaign");
    } finally {
      setActionId(null);
    }
  }

  async function rejectCampaign() {
    if (!rejectId || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionId(rejectId);
    try {
      const r = await fetch(`/api/admin/ads/${rejectId}/reject`, {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!r.ok) throw new Error();
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === rejectId
            ? { ...c, status: "REJECTED", rejectionReason: rejectReason }
            : c
        )
      );
      toast.success("Campaign rejected");
      setRejectId(null);
      setRejectReason("");
    } catch {
      toast.error("Failed to reject campaign");
    } finally {
      setActionId(null);
    }
  }

  async function savePlan() {
    const body = {
      name: planForm.name,
      description: planForm.description,
      price: Math.round(parseFloat(planForm.price) * 100), // NGN to kobo
      durationDays: parseInt(planForm.durationDays),
      formats: planForm.formats.split(",").map((s) => s.trim()),
      placements: planForm.placements.split(",").map((s) => s.trim()),
      maxImpressions: planForm.maxImpressions ? parseInt(planForm.maxImpressions) : undefined,
      sortOrder: parseInt(planForm.sortOrder),
    };

    try {
      const url = editingPlan ? `/api/admin/ad-plans/${editingPlan.id}` : "/api/admin/ad-plans";
      const method = editingPlan ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      toast.success(editingPlan ? "Plan updated" : "Plan created");
      setShowPlanForm(false);
      setEditingPlan(null);
      setPlanForm({ name: "", description: "", price: "", durationDays: "30", formats: "BANNER", placements: "HOMEPAGE_TOP", maxImpressions: "", sortOrder: "0" });
      fetchData();
    } catch {
      toast.error("Failed to save plan");
    }
  }

  async function deactivatePlan(id: string) {
    if (!confirm("Deactivate this plan? Existing campaigns won't be affected.")) return;
    try {
      const r = await fetch(`/api/admin/ad-plans/${id}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      if (!r.ok) throw new Error();
      toast.success("Plan deactivated");
      fetchData();
    } catch {
      toast.error("Failed to deactivate plan");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ads Management</h1>
        <p className="text-slate-500 text-sm mt-1">Review campaigns and manage ad plans</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {([
          { key: "pending", label: "Pending Review" },
          { key: "all", label: "All Campaigns" },
          { key: "plans", label: "Ad Plans" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === key
                ? "bg-green-700 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {/* Pending / All Campaigns */}
          {(tab === "pending" || tab === "all") && (
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
                  No campaigns found.
                </div>
              ) : (
                campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200 rounded-xl p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Creative preview */}
                      {c.creativeUrl ? (
                        <div className="shrink-0 w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={c.creativeUrl}
                            alt="Ad creative"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="shrink-0 w-full sm:w-32 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                          No creative
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{c.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {c.advertiser.name} Â· {c.advertiser.email}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[c.status] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                          <span>Format: <strong>{c.format}</strong></span>
                          <span>Placement: <strong>{c.placement.replace(/_/g, " ")}</strong></span>
                          <span>Plan: <strong>{c.plan.name}</strong></span>
                          <span>Price: <strong>{formatNaira(c.plan.price)}</strong></span>
                        </div>
                        <div className="mt-2">
                          <a
                            href={c.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline break-all"
                          >
                            {c.linkUrl}
                          </a>
                        </div>
                      </div>
                    </div>

                    {c.status === "PENDING_REVIEW" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => approveCampaign(c.id)}
                          disabled={actionId === c.id}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                        >
                          {actionId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(c.id)}
                          disabled={actionId === c.id}
                          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-red-200"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}

                    {c.rejectionReason && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-600">
                          <strong>Rejection reason:</strong> {c.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Plans */}
          {tab === "plans" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setPlanForm({ name: "", description: "", price: "", durationDays: "30", formats: "BANNER", placements: "HOMEPAGE_TOP", maxImpressions: "", sortOrder: "0" });
                    setShowPlanForm(true);
                  }}
                  className="flex items-center gap-2 bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-green-800 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Plan
                </button>
              </div>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                        {!plan.isActive && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span className="font-semibold text-green-700">{formatNaira(plan.price)}</span>
                        <span>{plan.durationDays} days</span>
                        <span>{plan.formats.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanForm({
                            name: plan.name,
                            description: plan.description,
                            price: String(Number(plan.price) / 100),
                            durationDays: String(plan.durationDays),
                            formats: plan.formats.join(", "),
                            placements: plan.placements.join(", "),
                            maxImpressions: "",
                            sortOrder: String(plan.sortOrder),
                          });
                          setShowPlanForm(true);
                        }}
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      {plan.isActive && (
                        <button
                          onClick={() => deactivatePlan(plan.id)}
                          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-900 mb-3">Reject Campaign</h3>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejecting this campaign. The advertiser will be
              notified via email.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. Content violates our advertising policy..."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectId(null); setRejectReason(""); }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={rejectCampaign}
                disabled={actionId !== null}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
              >
                {actionId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reject Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
            <h3 className="font-bold text-slate-900 mb-4">
              {editingPlan ? "Edit Plan" : "New Ad Plan"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Plan name"
                value={planForm.name}
                onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <textarea
                placeholder="Description"
                value={planForm.description}
                onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Price (NGN)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={planForm.price}
                    onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Duration (days)</label>
                  <input
                    type="number"
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm((p) => ({ ...p, durationDays: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Formats (comma-separated, e.g. BANNER, SIDEBAR)
                </label>
                <input
                  type="text"
                  value={planForm.formats}
                  onChange={(e) => setPlanForm((p) => ({ ...p, formats: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Placements (comma-separated, e.g. HOMEPAGE_TOP, LGA_SIDEBAR)
                </label>
                <input
                  type="text"
                  value={planForm.placements}
                  onChange={(e) => setPlanForm((p) => ({ ...p, placements: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Max Impressions (optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={planForm.maxImpressions}
                    onChange={(e) => setPlanForm((p) => ({ ...p, maxImpressions: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Sort Order</label>
                  <input
                    type="number"
                    value={planForm.sortOrder}
                    onChange={(e) => setPlanForm((p) => ({ ...p, sortOrder: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => { setShowPlanForm(false); setEditingPlan(null); }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                className="bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-green-800 transition-colors"
              >
                {editingPlan ? "Update Plan" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
