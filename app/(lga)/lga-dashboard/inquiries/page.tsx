"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Building2, Mail, Phone, Calendar, Briefcase, ChevronDown, ChevronUp } from "lucide-react";

interface Investor {
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  sector: string | null;
}

interface Endowment {
  title: string;
  category: string;
}

interface Inquiry {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  investor: Investor;
  endowment: Endowment | null;
}

function getLgaId() {
  return typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : "";
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  useEffect(() => {
    const lgaId = getLgaId();
    if (!lgaId) { setLoading(false); return; }

    fetch(`/api/investors/inquiries?lgaId=${lgaId}`)
      .then((r) => r.json())
      .then((d) => setInquiries(d.inquiries ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Investor Inquiries</h1>
        <p className="text-sm text-slate-500 mt-1">
          Messages from investors interested in your LGA&apos;s endowments and opportunities.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold mb-1">No inquiries yet</p>
          <p className="text-slate-400 text-sm">
            When investors express interest in your LGA&apos;s endowments, their messages will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const open = expanded === inq.id;
            return (
              <div key={inq.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(open ? null : inq.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-green-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{inq.investor.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {inq.investor.company ? `${inq.investor.company} · ` : ""}
                        {new Date(inq.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {inq.endowment && (
                      <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                        {inq.endowment.title}
                      </span>
                    )}
                    {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {open && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${inq.investor.email}`} className="hover:text-green-700 truncate">
                          {inq.investor.email}
                        </a>
                      </div>
                      {inq.investor.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <a href={`tel:${inq.investor.phone}`} className="hover:text-green-700">
                            {inq.investor.phone}
                          </a>
                        </div>
                      )}
                      {inq.investor.sector && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {inq.investor.sector}
                        </div>
                      )}
                    </div>

                    {/* Endowment tag */}
                    {inq.endowment && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Re:</span>
                        <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          {inq.endowment.title}
                        </span>
                        <span className="text-xs text-slate-400">{inq.endowment.category}</span>
                      </div>
                    )}

                    {/* Message */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{inq.message}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      Received {new Date(inq.createdAt).toLocaleString("en-NG", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>

                    <a
                      href={`mailto:${inq.investor.email}?subject=Re: Investment Inquiry`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" /> Reply via Email
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
