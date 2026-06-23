"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, MapPin, Clock, CheckCircle2, AlertCircle,
  ShieldOff, Users, TrendingUp, FileText, CalendarClock,
  UserCog, Newspaper, ArrowRight, BadgeCheck, BarChart2, CreditCard,
} from "lucide-react";

function getLgaId(): string {
  return typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : "";
}

interface LGAInfo {
  id: string;
  lgaName: string;
  state: string;
  chairmanName: string;
  status: string;
  isVerified: boolean;
  tenureStatus: string;
  tenureEndDate: string | null;
  gracePeriodEndsAt: string | null;
  freeUntil: string | null;
  subscriptionEnd: string | null;
  subscriptionStatus: string | null;
  _count: { wards: number; endowments: number; staff: number };
}

interface CitizenStats {
  total: number;
  active: number;
  recent: number;
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export default function LGADashboardPage() {
  const [lga,      setLga]      = useState<LGAInfo | null>(null);
  const [citizens, setCitizens] = useState<CitizenStats | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const lgaId = getLgaId();
    if (!lgaId) { setLoading(false); return; }

    Promise.all([
      fetch("/api/lga-dashboard/overview", { headers: { "x-lga-id": lgaId } }).then((r) => r.json()),
      fetch("/api/lga-dashboard/citizens",  { headers: { "x-lga-id": lgaId } }).then((r) => r.json()).catch(() => null),
    ])
      .then(([overviewJson, citizensJson]) => {
        setLga(overviewJson.lga ?? null);
        if (citizensJson && !citizensJson.error) setCitizens(citizensJson);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-4">
          {[0,1,2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Status-based banners ──────────────────────────────────────────── */
  const tenureStatus  = lga?.tenureStatus ?? "ACTIVE";
  const lgaStatus     = lga?.status ?? "PENDING";
  const endDate       = lga?.tenureEndDate ?? null;
  const graceEnd      = lga?.gracePeriodEndsAt ?? null;
  const freeUntil     = lga?.freeUntil ?? null;
  const subEnd        = lga?.subscriptionEnd ?? null;
  const subStatus     = lga?.subscriptionStatus ?? null;

  const daysLeftTenure = endDate ? daysUntil(endDate) : null;
  const graceDays      = graceEnd ? daysUntil(graceEnd) : null;
  const freeDays       = freeUntil ? daysUntil(freeUntil) : null;

  const daysLeftSub = subEnd ? daysUntil(subEnd) : null;

  const quickLinks = [
    { href: "/lga-dashboard/posts",      label: "Posts & Updates",    icon: Newspaper,     desc: "Publish news and updates"          },
    { href: "/lga-dashboard/analytics",  label: "Analytics",          icon: BarChart2,     desc: "Views, reactions & engagement"     },
    { href: "/lga-dashboard/wards",      label: "Wards",              icon: Users,         desc: "Manage ward councillors"            },
    { href: "/lga-dashboard/endowments", label: "Endowments",         icon: TrendingUp,    desc: "Showcase investment opportunities"  },
    { href: "/lga-dashboard/staff",      label: "Staff",              icon: UserCog,       desc: "Manage up to 2 staff accounts"      },
    { href: "/lga-dashboard/tenure",     label: "Tenure",             icon: CalendarClock, desc: "View & renew chairmanship term"     },
    { href: "/lga-dashboard/payments",   label: "Payments",           icon: CreditCard,    desc: "Subscription & payment history"    },
    { href: "/lga-dashboard/settings",   label: "Settings",           icon: FileText,      desc: "Update LGA profile & documents"    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-green-600" />
              <h1 className="text-2xl font-bold text-slate-900">
                {lga ? `${lga.lgaName} LGA Dashboard` : "LGA Dashboard"}
              </h1>
              {lga?.isVerified && <BadgeCheck className="h-5 w-5 text-green-600" />}
            </div>
            <p className="text-slate-500 text-sm">
              {lga ? `${lga.state} State · ${lga.chairmanName}` : "Manage your LGA portal and citizen communications."}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            lgaStatus === "APPROVED"  ? "bg-green-100 text-green-700" :
            lgaStatus === "PENDING"   ? "bg-amber-100 text-amber-700" :
            lgaStatus === "SUSPENDED" ? "bg-red-100 text-red-700"     : "bg-slate-100 text-slate-600"
          }`}>
            {lgaStatus}
          </span>
        </div>
      </div>

      {/* ── Alert banners ──────────────────────────────────────────────── */}

      {/* Pending approval */}
      {lgaStatus === "PENDING" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Awaiting Admin Review</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Your LGA registration is under review. This usually takes 1–3 business days.
              You will receive an email once approved.
            </p>
          </div>
        </div>
      )}

      {/* Suspended */}
      {lgaStatus === "SUSPENDED" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <ShieldOff className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Account Suspended</p>
            <p className="text-sm text-red-600 mt-0.5">
              Your account has been suspended. Please contact{" "}
              <a href="mailto:support@lgaportal.ng" className="underline">support@lgaportal.ng</a>.
            </p>
          </div>
        </div>
      )}

      {/* Tenure grace period */}
      {tenureStatus === "TENURE_ENDED" && graceDays !== null && graceDays > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Tenure Grace Period — {graceDays} day{graceDays !== 1 ? "s" : ""} left</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Your chairmanship tenure has ended. Submit re-election documents before the grace period expires.
            </p>
          </div>
          <Link
            href="/lga-dashboard/tenure"
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
          >
            Renew <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Tenure expiring soon */}
      {tenureStatus === "ACTIVE" && daysLeftTenure !== null && daysLeftTenure <= 30 && daysLeftTenure > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Tenure Expiring in {daysLeftTenure} day{daysLeftTenure !== 1 ? "s" : ""}</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Prepare your Certificate of Return to submit on your Tenure page.
            </p>
          </div>
          <Link
            href="/lga-dashboard/tenure"
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-colors"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Free trial expiry */}
      {freeDays !== null && freeDays <= 14 && freeDays > 0 && (
        <div className={`border rounded-xl p-4 mb-5 flex items-start gap-3 ${
          freeDays <= 3 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
        }`}>
          <Clock className={`h-5 w-5 shrink-0 mt-0.5 ${freeDays <= 3 ? "text-red-600" : "text-blue-600"}`} />
          <div>
            <p className={`text-sm font-bold ${freeDays <= 3 ? "text-red-800" : "text-blue-800"}`}>
              Free Trial Expires in {freeDays} day{freeDays !== 1 ? "s" : ""}
            </p>
            <p className={`text-sm mt-0.5 ${freeDays <= 3 ? "text-red-600" : "text-blue-600"}`}>
              Subscribe before your trial ends to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {/* Subscription status card */}
      {lga && lgaStatus === "APPROVED" && (
        <div className={`rounded-xl p-4 mb-5 border flex items-center justify-between gap-4 ${
          subStatus === "active" || (!subEnd && !freeUntil)
            ? "bg-green-50 border-green-200"
            : daysLeftSub !== null && daysLeftSub <= 7
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center gap-3">
            <CreditCard className={`h-5 w-5 shrink-0 ${
              daysLeftSub !== null && daysLeftSub <= 7 ? "text-red-500" : "text-blue-600"
            }`} />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {freeUntil && !subEnd ? "Free Trial" : subStatus === "active" ? "Subscription Active" : "Subscription"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {freeUntil && !subEnd
                  ? `Free until ${new Date(freeUntil).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
                  : subEnd
                    ? `Renews ${new Date(subEnd).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
                    : "No active subscription"}
              </p>
            </div>
          </div>
          <Link
            href="/lga-dashboard/payments"
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-semibold transition-colors"
          >
            {subEnd ? "Manage" : "Subscribe"} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Stats row */}
      {lga && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Wards",       value: lga._count.wards,       icon: MapPin    },
            { label: "Endowments",  value: lga._count.endowments,  icon: TrendingUp },
            { label: "Staff",       value: lga._count.staff,       icon: UserCog   },
            { label: "Citizens",    value: citizens?.total ?? "—",  icon: Users     },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
              <Icon className="h-4 w-4 text-green-600 mx-auto mb-1.5" />
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* What happens next (only for pending / no data) */}
      {(!lga || lgaStatus === "PENDING") && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">What happens next?</h3>
          <div className="space-y-3">
            {[
              {
                icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600",
                title: "Email Verified", desc: "Your email address has been confirmed.", done: true,
              },
              {
                icon: Clock, bg: "bg-amber-50", color: "text-amber-600",
                title: "Admin Review",
                desc: "Our team will review your LGA registration documents.",
                done: lgaStatus === "APPROVED",
              },
              {
                icon: Building2, bg: "bg-slate-50", color: "text-slate-400",
                title: "Account Activated",
                desc: "Once approved, you will have full access to the LGA dashboard.",
                done: lgaStatus === "APPROVED",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.done ? "text-green-700" : "text-slate-700"}`}>
                    {item.title}
                    {item.done && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Done</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links (only for approved) */}
      {lgaStatus === "APPROVED" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-green-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-sm font-semibold text-slate-900">{label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-green-600 ml-auto transition-colors" />
              </div>
              <p className="text-xs text-slate-400 pl-11">{desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
