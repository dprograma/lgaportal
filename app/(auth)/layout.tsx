import Link from "next/link";
import { Shield } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Official header bar */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="LGA Citizen Portal home">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
              <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-slate-900 text-sm">LGA Citizen Portal</span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-normal tracking-wider uppercase">
                Federal Republic of Nigeria
              </span>
            </div>
          </Link>
          <span className="text-xs text-slate-400 hidden sm:block">
            Official citizen registration platform
          </span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 shrink-0">
        <p className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} LGA Citizen Portal &middot; Federal Republic of Nigeria &middot;{" "}
          <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="hover:text-green-700 transition-colors">Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}
