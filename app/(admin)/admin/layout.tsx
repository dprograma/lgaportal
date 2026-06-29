"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Clock, ShieldCheck, LogOut, BarChart2, ShieldAlert, Megaphone, DollarSign, Users, Activity, FileText, ClipboardList, Newspaper, Radio, Loader2 } from "lucide-react";

const navItems = [
  { href: "/admin",                label: "Overview",        icon: LayoutDashboard },
  { href: "/admin/lgas",           label: "LGA Approvals",   icon: Building2       },
  { href: "/admin/users",          label: "Users",           icon: Users           },
  { href: "/admin/analytics",      label: "Analytics",       icon: Activity        },
  { href: "/admin/expiring",       label: "Expiring Trials", icon: Clock           },
  { href: "/admin/allocations",    label: "Allocations",     icon: BarChart2       },
  { href: "/admin/procurement",    label: "Procurement",     icon: FileText        },
  { href: "/admin/audit-reports",  label: "Audit Reports",   icon: ClipboardList   },
  { href: "/admin/press-releases", label: "Press Releases",  icon: Newspaper       },
  { href: "/admin/live-streams",   label: "Live Streams",    icon: Radio           },
  { href: "/admin/moderation",     label: "Moderation",      icon: ShieldAlert     },
  { href: "/admin/ads",            label: "Ads",             icon: Megaphone       },
  { href: "/admin/revenue",        label: "Revenue",         icon: DollarSign      },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Skip auth check on the login page itself
    if (pathname === "/admin/login") { setReady(true); return; }

    const stored = sessionStorage.getItem("adminSecret");
    if (stored) { setReady(true); return; }

    // Cookie may be set (e.g. page refresh) — try to recover the secret
    fetch("/api/admin/auth")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ secret }: { secret: string }) => {
        sessionStorage.setItem("adminSecret", secret);
        setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router]);

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    sessionStorage.removeItem("adminSecret");
    router.replace("/admin/login");
  };

  if (!ready) return (
    <div className="min-h-screen bg-[#071a0e] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-green-500" />
    </div>
  );

  // Login page uses no sidebar
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#0f2d1a] text-white">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-white/10">
          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-white text-sm">LGA Portal</p>
            <p className="text-[10px] text-green-400 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-green-600 text-white" : "text-green-100/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-100/50 hover:bg-white/10 hover:text-white transition-all"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            View Site
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-100/50 hover:bg-red-900/30 hover:text-red-300 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-[#0f2d1a] h-14 flex items-center px-4 gap-3">
          <ShieldCheck className="h-5 w-5 text-green-400" />
          <span className="font-bold text-white text-sm">Admin Panel</span>
        </header>
        <nav className="lg:hidden bg-[#0f2d1a] flex overflow-x-auto gap-1 px-2 py-1.5 border-b border-white/10">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active ? "bg-green-600 text-white" : "text-green-100/60 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
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
