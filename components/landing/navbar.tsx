"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Search, ChevronDown, MapPin, BadgeCheck,
  LayoutDashboard, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";

/** Two-letter avatar initials from a display name (falls back to email/“U”). */
function initials(name: string | null, email: string | null): string {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

const navLinks = [
  { label: "Home",        href: "/" },
  { label: "Explore LGAs",href: "/#explore" },
  { label: "Map",         href: "/map" },
  { label: "Projects",    href: "/projects" },
  { label: "Allocations", href: "/allocations" },
  { label: "News",        href: "/news" },
  { label: "Live",        href: "/live-streams" },
  { label: "How It Works",href: "/#how-it-works" },
];

const signInOptions = [
  { label: "Citizen Login",   href: "/login" },
  { label: "LGA Admin Login", href: "/lga-login" },
];

const getStartedOptions = [
  { label: "Join as Citizen",   href: "/signup" },
  { label: "Register Your LGA", href: "/lga-signup" },
];

const dropdownVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

interface LGAResult {
  id:         string;
  lgaName:    string;
  state:      string;
  isVerified: boolean;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Reusable search bar component ────────────────────────────────────────────

function SearchBar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const router = useRouter();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<LGAResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/lgas/list?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setResults(data.lgas ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchResults]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      router.push(`/lgas?search=${encodeURIComponent(query.trim())}`);
      onNavigate?.();
    }
    if (e.key === "Escape") { setOpen(false); }
  }

  function handleSelect(lgaName: string) {
    setQuery("");
    setOpen(false);
    router.push(`/lgas/${toSlug(lgaName)}`);
    onNavigate?.();
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className={cn(
        "flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border transition-all",
        open || query ? "border-green-500 bg-white" : "border-transparent"
      )}>
        {loading
          ? <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-green-600 animate-spin shrink-0" />
          : <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        }
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search LGA, State…"
          className="bg-transparent text-xs text-slate-600 placeholder:text-slate-400 outline-none flex-1 min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden"
          >
            {results.map((lga) => (
              <button
                key={lga.id}
                onClick={() => handleSelect(lga.lgaName)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left"
              >
                <div className="h-7 w-7 rounded-lg bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                  {lga.lgaName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {lga.lgaName} LGA
                    {lga.isVerified && (
                      <BadgeCheck className="inline h-3 w-3 text-green-600 ml-1" />
                    )}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-0.5 truncate">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    {lga.state} State
                  </p>
                </div>
              </button>
            ))}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/lgas?search=${encodeURIComponent(query.trim())}`);
                  onNavigate?.();
                }}
                className="text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                See all results for &ldquo;{query}&rdquo; →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [signInOpen,    setSignInOpen]    = useState(false);
  const [getStartedOpen,setGetStartedOpen]= useState(false);
  const [accountOpen,   setAccountOpen]   = useState(false);

  const signInRef      = useRef<HTMLDivElement>(null);
  const getStartedRef  = useRef<HTMLDivElement>(null);
  const accountRef     = useRef<HTMLDivElement>(null);

  const user = useCurrentUser();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (signInRef.current && !signInRef.current.contains(e.target as Node)) setSignInOpen(false);
      if (getStartedRef.current && !getStartedRef.current.contains(e.target as Node)) setGetStartedOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "top-0 bg-white shadow-md border-b border-slate-200"
          : "top-9 bg-white/98 border-b border-slate-100"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-green-700 flex items-center justify-center text-lg leading-none">
            🏛️
          </div>
          <span className="font-bold text-slate-900 text-base leading-tight">
            LGA Citizen{" "}
            <span className="text-green-700 font-bold">Portal</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all inline-block"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop search bar */}
        <SearchBar className="hidden lg:block w-60" />

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2">
          {user.loading ? (
            /* Reserve space while auth state resolves, to avoid a Sign In flash */
            <div className="h-8 w-40" aria-hidden />
          ) : user.authenticated ? (
            /* Account dropdown (authenticated) */
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => { setAccountOpen((v) => !v); setSignInOpen(false); setGetStartedOpen(false); }}
                className="flex items-center gap-2 border border-slate-200 rounded-lg pl-1.5 pr-2.5 py-1 hover:border-green-500 transition-all"
              >
                <span className="h-7 w-7 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {initials(user.name, user.email)}
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium text-slate-700">
                  {user.name || user.email || "Account"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="initial" animate="animate" exit="exit"
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-elevated py-1.5 z-50"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.name || "Account"}</p>
                      {user.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
                    </div>
                    {user.dashboardHref && (
                      <Link href={user.dashboardHref} onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                        <LayoutDashboard className="h-4 w-4 shrink-0" /> Dashboard
                      </Link>
                    )}
                    {user.settingsHref && (
                      <Link href={user.settingsHref} onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                        <Settings className="h-4 w-4 shrink-0" /> Settings
                      </Link>
                    )}
                    <button
                      onClick={() => { setAccountOpen(false); user.logout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                    >
                      <LogOut className="h-4 w-4 shrink-0" /> Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
          <>
          {/* Sign In dropdown */}
          <div className="relative" ref={signInRef}>
            <button
              onClick={() => { setSignInOpen((v) => !v); setGetStartedOpen(false); }}
              className="border border-slate-200 rounded-lg px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-green-500 hover:text-green-700 flex items-center gap-1 whitespace-nowrap shrink-0 transition-all"
            >
              Sign In
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </button>
            <AnimatePresence>
              {signInOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-elevated py-1.5 z-50"
                >
                  {signInOptions.map((opt) => (
                    <Link key={opt.href} href={opt.href} onClick={() => setSignInOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                      {opt.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Get Started dropdown */}
          <div className="relative" ref={getStartedRef}>
            <button
              onClick={() => { setGetStartedOpen((v) => !v); setSignInOpen(false); }}
              className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-1.5 text-sm font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 transition-all"
            >
              Get Started
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </button>
            <AnimatePresence>
              {getStartedOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-elevated py-1.5 z-50"
                >
                  {getStartedOptions.map((opt) => (
                    <Link key={opt.href} href={opt.href} onClick={() => setGetStartedOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                      {opt.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden border-t border-slate-100 bg-white"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {/* Mobile search — full width, closes drawer on navigate */}
              <SearchBar
                className="w-full mb-2"
                onNavigate={() => setMobileOpen(false)}
              />

              {/* Nav links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {user.authenticated ? (
                /* Account section (authenticated) */
                <div className="pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                    <span className="h-8 w-8 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {initials(user.name, user.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.name || "Account"}</p>
                      {user.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
                    </div>
                  </div>
                  {user.dashboardHref && (
                    <Link href={user.dashboardHref} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                      <LayoutDashboard className="h-4 w-4 shrink-0" /> Dashboard
                    </Link>
                  )}
                  {user.settingsHref && (
                    <Link href={user.settingsHref} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                      <Settings className="h-4 w-4 shrink-0" /> Settings
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileOpen(false); user.logout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" /> Log Out
                  </button>
                </div>
              ) : (
              <>
              {/* Sign In group */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Sign In
                </p>
                {signInOptions.map((opt) => (
                  <Link key={opt.href} href={opt.href} onClick={() => setMobileOpen(false)}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                    {opt.label}
                  </Link>
                ))}
              </div>

              {/* Get Started group */}
              <div className="pt-3 border-t border-slate-100">
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Get Started
                </p>
                {getStartedOptions.map((opt) => (
                  <Link key={opt.href} href={opt.href} onClick={() => setMobileOpen(false)}
                    className="flex items-center px-3 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                    {opt.label}
                  </Link>
                ))}
              </div>
              </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
