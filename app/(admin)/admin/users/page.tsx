"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, ShieldOff, ShieldCheck, Ban, CheckCircle,
  Clock, AlertCircle, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const adminSecret = () => sessionStorage.getItem("adminSecret") ?? "";

type RoleFilter   = "ALL" | "CITIZEN" | "ADVERTISER" | "LGA_CHAIRMAN" | "LGA_STAFF";
type StatusFilter = "ALL" | "ACTIVE" | "BANNED" | "SUSPENDED";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  state: string | null;
  lga: string | null;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  suspendedUntil: string | null;
  createdAt: string;
  emailVerified: string | null;
  _count: { reactions: number; comments: number };
}

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: "All",          value: "ALL"          },
  { label: "Citizens",     value: "CITIZEN"       },
  { label: "Advertisers",  value: "ADVERTISER"    },
  { label: "Chairmen",     value: "LGA_CHAIRMAN"  },
  { label: "LGA Staff",    value: "LGA_STAFF"     },
];

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    CITIZEN:      "bg-blue-100 text-blue-700",
    ADVERTISER:   "bg-purple-100 text-purple-700",
    LGA_CHAIRMAN: "bg-green-100 text-green-700",
    LGA_STAFF:    "bg-teal-100 text-teal-700",
    ADMIN:        "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[role] ?? "bg-slate-100 text-slate-600"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState<UserItem[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [roleTab,    setRoleTab]    = useState<RoleFilter>("ALL");
  const [status,     setStatus]     = useState<StatusFilter>("ALL");
  const [search,     setSearch]     = useState("");
  const [dSearch,    setDSearch]    = useState("");
  const [page,       setPage]       = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acting,     setActing]     = useState<string | null>(null);
  const [modal,      setModal]      = useState<{ userId: string; action: "ban" | "suspend" } | null>(null);
  const [reason,     setReason]     = useState("");
  const [hours,      setHours]      = useState(24);
  const PAGE = 25;

  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [roleTab, status]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE), offset: String(page * PAGE),
      role: roleTab, status,
      ...(dSearch ? { search: dSearch } : {}),
    });
    try {
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { "x-admin-secret": adminSecret() },
      });
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [roleTab, status, dSearch, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const runAction = async (userId: string, action: string, extra?: object) => {
    setActing(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      fetchUsers();
    } catch { toast.error("Action failed."); }
    finally { setActing(null); }
  };

  const submitModal = async () => {
    if (!modal) return;
    if (modal.action === "ban" && reason.length < 5) {
      toast.error("Reason must be at least 5 characters.");
      return;
    }
    await runAction(modal.userId, modal.action,
      modal.action === "ban" ? { reason } : { durationHours: hours }
    );
    setModal(null);
    setReason("");
    setHours(24);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-green-400" />
          <h1 className="text-2xl font-bold text-white">User Management</h1>
        </div>
        <p className="text-green-200/60 text-sm">{total.toLocaleString()} total accounts</p>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 bg-white/10 p-1 rounded-xl mb-4 overflow-x-auto">
        {ROLE_TABS.map(({ label, value }) => (
          <button key={value} onClick={() => setRoleTab(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              roleTab === value ? "bg-green-600 text-white" : "text-green-100/70 hover:bg-white/10 hover:text-white"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text" placeholder="Search name or emailâ€¦"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-green-200/40 text-sm focus:outline-none focus:border-green-400"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-sm text-white focus:outline-none focus:border-green-400">
          <option value="ALL" className="text-slate-900">All Status</option>
          <option value="ACTIVE" className="text-slate-900">Active</option>
          <option value="BANNED" className="text-slate-900">Banned</option>
          <option value="SUSPENDED" className="text-slate-900">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="h-16 px-6 flex items-center gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id}>
                <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 truncate">{user.name}</span>
                      <RoleBadge role={user.role} />
                      {user.isBanned && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-semibold">BANNED</span>
                      )}
                      {!user.isBanned && user.suspendedUntil && new Date(user.suspendedUntil) > new Date() && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-semibold">SUSPENDED</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.isBanned ? (
                      <button onClick={() => runAction(user.id, "activate")} disabled={acting === user.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-semibold disabled:opacity-40">
                        <ShieldCheck className="h-3.5 w-3.5" /> Unban
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setModal({ userId: user.id, action: "suspend" }); }}
                          disabled={acting === user.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-semibold disabled:opacity-40">
                          <Clock className="h-3.5 w-3.5" /> Suspend
                        </button>
                        <button onClick={() => { setModal({ userId: user.id, action: "ban" }); }}
                          disabled={acting === user.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold disabled:opacity-40">
                          <Ban className="h-3.5 w-3.5" /> Ban
                        </button>
                      </>
                    )}
                    <button onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === user.id ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === user.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                      <div className="px-5 pb-4 pt-3 bg-slate-50 border-t border-slate-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                          <div><span className="font-medium">State:</span> {user.state ?? "â€”"}</div>
                          <div><span className="font-medium">LGA:</span> {user.lga ?? "â€”"}</div>
                          <div><span className="font-medium">Reactions:</span> {user._count.reactions}</div>
                          <div><span className="font-medium">Comments:</span> {user._count.comments}</div>
                          <div><span className="font-medium">Joined:</span> {new Date(user.createdAt).toLocaleDateString("en-NG")}</div>
                          <div><span className="font-medium">Verified:</span> {user.emailVerified ? "Yes" : "No"}</div>
                          {user.banReason && (
                            <div className="col-span-2"><span className="font-medium">Ban reason:</span> {user.banReason}</div>
                          )}
                          {user.suspendedUntil && new Date(user.suspendedUntil) > new Date() && (
                            <div className="col-span-2">
                              <span className="font-medium">Suspended until:</span>{" "}
                              {new Date(user.suspendedUntil).toLocaleString("en-NG")}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(total / PAGE) > 1 && (
        <div className="mt-5 flex items-center justify-between text-white">
          <p className="text-sm text-green-200/60">
            Showing {page * PAGE + 1}â€“{Math.min((page + 1) * PAGE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-white/20 text-sm disabled:opacity-40 hover:bg-white/10">
              â† Prev
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE >= total}
              className="px-4 py-2 rounded-xl border border-white/20 text-sm disabled:opacity-40 hover:bg-white/10">
              Next â†’
            </button>
          </div>
        </div>
      )}

      {/* Ban / Suspend modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setModal(null); setReason(""); } }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  modal.action === "ban" ? "bg-red-100" : "bg-orange-100"
                }`}>
                  {modal.action === "ban"
                    ? <Ban className="h-5 w-5 text-red-600" />
                    : <Clock className="h-5 w-5 text-orange-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 capitalize">{modal.action} User</h3>
                  <p className="text-xs text-slate-500">
                    {modal.action === "ban"
                      ? "This will permanently block the account."
                      : "Temporarily restrict account access."}
                  </p>
                </div>
              </div>

              {modal.action === "ban" ? (
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for ban (min 5 characters)â€¦" rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none mb-4" />
              ) : (
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Duration</label>
                  <select value={hours} onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400">
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>7 days</option>
                    <option value={720}>30 days</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setModal(null); setReason(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={submitModal} disabled={!!acting}
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${
                    modal.action === "ban"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}>
                  Confirm {modal.action === "ban" ? "Ban" : "Suspension"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

