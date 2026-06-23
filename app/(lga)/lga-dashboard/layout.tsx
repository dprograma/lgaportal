"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, FileText, MessageSquare,
  Settings, LogOut, Shield, Users, Newspaper, UserCog, CalendarClock, CreditCard,
  BarChart2,
} from "lucide-react";

const navItems = [
  { href: "/lga-dashboard",             label: "Overview",           icon: LayoutDashboard },
  { href: "/lga-dashboard/posts",       label: "Posts & Updates",    icon: Newspaper       },
  { href: "/lga-dashboard/analytics",   label: "Analytics",          icon: BarChart2       },
  { href: "/lga-dashboard/wards",       label: "Wards & Councillors",icon: Users           },
  { href: "/lga-dashboard/endowments",  label: "Endowments",         icon: TrendingUp      },
  { href: "/lga-dashboard/projects",    label: "Projects",           icon: FileText        },
  { href: "/lga-dashboard/inquiries",   label: "Investor Inquiries", icon: MessageSquare   },
  { href: "/lga-dashboard/press-releases", label: "Press Releases",     icon: Newspaper       },
  { href: "/lga-dashboard/staff",          label: "Staff Management",   icon: UserCog         },
  { href: "/lga-dashboard/tenure",         label: "Tenure",             icon: CalendarClock   },
  { href: "/lga-dashboard/payments",       label: "Payments",           icon: CreditCard      },
  { href: "/lga-dashboard/settings",       label: "Settings",           icon: Settings        },
];

export default function LGADashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-green-700 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900 text-sm">LGA Portal</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/lga-dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-green-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4">
          <Link
            href="/lga-login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-3">
          <div className="h-7 w-7 rounded-lg bg-green-700 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-900 text-sm">LGA Dashboard</span>
        </header>

        {/* Mobile nav strip */}
        <nav className="lg:hidden bg-white border-b border-slate-200 flex overflow-x-auto gap-0.5 px-2 py-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/lga-dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-green-700 text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
