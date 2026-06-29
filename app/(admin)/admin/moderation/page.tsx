"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ShieldAlert, ClipboardList, Trash2, BanIcon, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const adminSecret = () => sessionStorage.getItem("adminSecret") ?? "";

interface FlagReport {
  id: string;
  contentType: string;
  reason: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  post?: { id: string; title: string } | null;
  project?: { id: string; title: string } | null;
}

interface ModerationAction {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  admin: { id: string; name: string; email: string };
}

function authHeader() {
  return { "x-admin-secret": adminSecret(), "Content-Type": "application/json" };
}

export default function ModerationPage() {
  const [tab, setTab] = useState<"reports" | "log">("reports");
  const [reports, setReports] = useState<FlagReport[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        fetch(`/api/admin/reports?status=${statusFilter}`, { headers: authHeader() }),
        fetch("/api/admin/moderation", { headers: authHeader() }),
      ]);
      if (rRes.ok) {
        const d = await rRes.json();
        setReports(d.reports ?? []);
      }
      if (mRes.ok) {
        const d = await mRes.json();
        setActions(d.recentActions ?? []);
      }
    } catch {
      toast.error("Failed to load moderation data.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function dismissReport(id: string) {
    setActing(id);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ id, status: "DISMISSED" }),
      });
      if (res.ok) {
        toast.success("Report dismissed.");
        fetchData();
      } else {
        toast.error("Failed to dismiss report.");
      }
    } finally {
      setActing(null);
    }
  }

  async function deleteContent(report: FlagReport) {
    setActing(report.id);
    try {
      const targetId = report.project?.id ?? report.post?.id ?? "";
      const targetType = report.contentType;

      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          action: "DELETE",
          targetType,
          targetId,
          reason: report.reason,
        }),
      });
      if (res.ok) {
        await fetch("/api/admin/reports", {
          method: "PATCH",
          headers: authHeader(),
          body: JSON.stringify({ id: report.id, status: "REVIEWED" }),
        });
        toast.success("Content deleted.");
        fetchData();
      } else {
        toast.error("Failed to delete content.");
      }
    } finally {
      setActing(null);
    }
  }

  async function suspendUser(report: FlagReport, days = 7) {
    setActing(report.id);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          action: "SUSPEND",
          targetType: "user",
          targetId: report.user.id,
          reason: `Report: ${report.reason}`,
          duration: days,
        }),
      });
      if (res.ok) {
        toast.success(`User suspended for ${days} days.`);
        fetchData();
      } else {
        toast.error("Failed to suspend user.");
      }
    } finally {
      setActing(null);
    }
  }

  function getContentTitle(r: FlagReport) {
    return r.project?.title ?? r.post?.title ?? "(unknown)";
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="h-6 w-6 text-red-600" />
        <h1 className="text-xl font-bold text-slate-800">Content Moderation</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "reports"
              ? "border-green-600 text-green-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Reports Queue
        </button>
        <button
          onClick={() => setTab("log")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "log"
              ? "border-green-600 text-green-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          Moderation Log
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : tab === "reports" ? (
        <>
          {/* Status filter */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-500">Status:</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-green-500"
              >
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {reports.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No reports found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Content</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Reason</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Reporter</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">
                        {getContentTitle(r)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                          {r.contentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.reason}</td>
                      <td className="px-4 py-3 text-slate-500">{r.user.name}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-NG")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => dismissReport(r.id)}
                            disabled={acting === r.id}
                            className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => deleteContent(r)}
                            disabled={acting === r.id}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                          <button
                            onClick={() => suspendUser(r, 7)}
                            disabled={acting === r.id}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                          >
                            <BanIcon className="h-3 w-3" />
                            Suspend 7d
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {actions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No moderation actions yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Target</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Reason</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Admin</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actions.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          a.action === "BAN" ? "bg-red-100 text-red-700"
                          : a.action === "SUSPEND" ? "bg-orange-100 text-orange-700"
                          : a.action === "DELETE" ? "bg-red-50 text-red-600"
                          : "bg-slate-100 text-slate-600"
                        }`}>
                          {a.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {a.targetType}: {a.targetId.slice(0, 12)}â€¦
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{a.reason}</td>
                      <td className="px-4 py-3 text-slate-500">{a.admin.name}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(a.createdAt).toLocaleDateString("en-NG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

