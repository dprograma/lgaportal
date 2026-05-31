import Link from "next/link";
import { Building2, Clock, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [pending, approved, rejected, expiring] = await Promise.all([
    db.lGA.count({ where: { status: "PENDING"  } }),
    db.lGA.count({ where: { status: "APPROVED" } }),
    db.lGA.count({ where: { status: "REJECTED" } }),
    db.lGA.count({
      where: {
        status: "APPROVED",
        freeUntil: { gt: new Date(), lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const stats = [
    { label: "Pending Approval", value: pending,  icon: Clock,        color: "bg-amber-50 text-amber-700",  border: "border-amber-200" },
    { label: "Approved LGAs",    value: approved, icon: CheckCircle,  color: "bg-green-50 text-green-700",  border: "border-green-200" },
    { label: "Rejected",         value: rejected, icon: XCircle,      color: "bg-red-50 text-red-700",      border: "border-red-200"   },
    { label: "Trials Expiring",  value: expiring, icon: ShieldCheck,  color: "bg-blue-50 text-blue-700",    border: "border-blue-200"  },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor and manage LGA registrations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} p-5`}>
            <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/lgas?status=PENDING" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-green-400 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">Review Pending LGAs</h3>
          </div>
          <p className="text-sm text-slate-500">{pending} LGA{pending !== 1 ? "s" : ""} awaiting approval</p>
          <p className="text-xs text-green-700 mt-3 group-hover:underline">Go to approvals →</p>
        </Link>

        <Link href="/admin/lgas" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-green-400 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-slate-800">All LGAs</h3>
          </div>
          <p className="text-sm text-slate-500">{approved + pending + rejected} total registered LGAs</p>
          <p className="text-xs text-green-700 mt-3 group-hover:underline">View all →</p>
        </Link>
      </div>
    </div>
  );
}
