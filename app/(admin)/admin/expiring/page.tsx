"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Building2, Mail, Phone, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const adminSecret = () => sessionStorage.getItem("adminSecret") ?? "";

interface ExpiringLGA {
  id:           string;
  lgaName:      string;
  state:        string;
  chairmanName: string;
  email:        string;
  phone:        string;
  freeUntil:    string;
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export default function ExpiringTrialsPage() {
  const [lgas,     setLgas]     = useState<ExpiringLGA[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [sentIds,  setSentIds]  = useState<Set<string>>(new Set());

  const fetchExpiring = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/lgas/expiring", {
        headers: { "x-admin-secret": adminSecret() },
      });
      const data = await res.json();
      setLgas(data.lgas ?? []);
    } catch {
      toast.error("Failed to load expiring LGAs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExpiring(); }, [fetchExpiring]);

  const sendAllReminders = async () => {
    setSending(true);
    try {
      const res  = await fetch("/api/admin/lgas/expiring", {
        method:  "POST",
        headers: { "x-admin-secret": adminSecret() },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`Reminders sent to ${data.sent} LGA${data.sent !== 1 ? "s" : ""}.`);
      setSentIds(new Set(lgas.map((l) => l.id)));
    } catch {
      toast.error("Failed to send reminders.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expiring Trials</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            LGAs whose free trial expires within the next 14 days
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchExpiring}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={sendAllReminders}
            disabled={sending || lgas.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {sending ? "Sendingâ€¦" : "Send All Reminders"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            {lgas.length} LGA{lgas.length !== 1 ? "s" : ""} with expiring trials
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Click &ldquo;Send All Reminders&rdquo; to email each chairman. Individual reminders are sent automatically by the system cron.
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-20 animate-pulse" />
          ))}
        </div>
      ) : lgas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <Clock className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No expiring trials in the next 14 days</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lgas.map((lga) => {
            const days = daysUntil(lga.freeUntil);
            const sent = sentIds.has(lga.id);
            return (
              <motion.div
                key={lga.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
              >
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-base shrink-0">
                  {lga.lgaName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900">{lga.lgaName} LGA</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">{lga.state}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      days <= 3 ? "bg-red-100 text-red-700" :
                      days <= 7 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {days <= 0 ? "Expired" : `${days}d left`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{lga.chairmanName}</p>
                  <div className="flex gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lga.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lga.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`text-center ${days <= 3 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-blue-600"}`}>
                    <p className="text-2xl font-extrabold leading-none">{Math.max(0, days)}</p>
                    <p className="text-[10px] font-medium">days</p>
                  </div>
                  {sent && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Sent
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

