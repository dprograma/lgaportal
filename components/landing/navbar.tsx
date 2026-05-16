"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Explore LGAs", href: "/#explore" },
  { label: "Projects", href: "/projects" },
  { label: "News", href: "/news" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Contact", href: "/contact" },
];

const signInOptions = [
  { label: "Citizen Login", href: "/login" },
  { label: "LGA Admin Login", href: "/lga-login" },
];

const getStartedOptions = [
  { label: "Join as Citizen", href: "/signup" },
  { label: "Register Your LGA", href: "/lga-signup" },
];

const dropdownVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  const signInRef = useRef<HTMLDivElement>(null);
  const getStartedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (signInRef.current && !signInRef.current.contains(e.target as Node)) {
        setSignInOpen(false);
      }
      if (getStartedRef.current && !getStartedRef.current.contains(e.target as Node)) {
        setGetStartedOpen(false);
      }
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

        {/* Search bar */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 w-64 border border-transparent focus-within:border-green-500 focus-within:bg-white transition-all">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search LGA, State, Project…"
            className="bg-transparent text-xs text-slate-600 placeholder:text-slate-400 outline-none flex-1"
          />
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Sign In dropdown */}
          <div className="relative" ref={signInRef}>
            <button
              onClick={() => {
                setSignInOpen((v) => !v);
                setGetStartedOpen(false);
              }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-green-500 hover:text-green-700 flex items-center gap-1 transition-all"
            >
              Sign In
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {signInOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-elevated py-1.5 z-50"
                >
                  {signInOptions.map((opt) => (
                    <Link
                      key={opt.href}
                      href={opt.href}
                      onClick={() => setSignInOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
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
              onClick={() => {
                setGetStartedOpen((v) => !v);
                setSignInOpen(false);
              }}
              className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-1.5 text-sm font-semibold flex items-center gap-1 transition-all"
            >
              Get Started
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {getStartedOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-elevated py-1.5 z-50"
                >
                  {getStartedOptions.map((opt) => (
                    <Link
                      key={opt.href}
                      href={opt.href}
                      onClick={() => setGetStartedOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      {opt.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              {/* Mobile search */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 border border-transparent focus-within:border-green-500 focus-within:bg-white transition-all mb-2">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search LGA, State, Project…"
                  className="bg-transparent text-xs text-slate-600 placeholder:text-slate-400 outline-none flex-1"
                />
              </div>

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

              {/* Sign In group */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Sign In
                </p>
                {signInOptions.map((opt) => (
                  <Link
                    key={opt.href}
                    href={opt.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
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
                  <Link
                    key={opt.href}
                    href={opt.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-3 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
