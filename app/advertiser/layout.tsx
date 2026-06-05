"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Megaphone,
  CreditCard,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";

const navItems = [
  { href: "/advertiser", label: "Dashboard", icon: LayoutDashboard },
  { href: "/advertiser/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/advertiser/payments", label: "Payments", icon: CreditCard },
  { href: "/advertiser/settings", label: "Settings", icon: Settings },
];

export default function AdvertiserLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login?callbackUrl=/advertiser");
      return;
    }
    if (session.user.role !== "ADVERTISER") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "ADVERTISER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-green-700 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900 text-sm">LGA Portal</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Advertiser</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/advertiser" && pathname.startsWith(href));
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

        <div className="px-3 pb-4 border-t border-slate-100 pt-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-slate-700 truncate">{session.user.name}</p>
            <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-green-700 flex items-center justify-center">
              <Megaphone className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-900 text-sm">Advertiser Panel</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-slate-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <nav className="lg:hidden bg-white border-b border-slate-200 flex overflow-x-auto gap-0.5 px-2 py-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/advertiser" && pathname.startsWith(href));
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
