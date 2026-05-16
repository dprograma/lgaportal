"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronUp, Users, Building2 } from "lucide-react";

export default function FloatingElements() {
  const [scrollY, setScrollY] = useState(0);
  const [showMobileBar, setShowMobileBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowMobileBar(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Back to Top button */}
      <AnimatePresence>
        {scrollY > 400 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-green-700 hover:bg-green-800 text-white shadow-lg flex items-center justify-center transition-colors"
          >
            <ChevronUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* WhatsApp support widget */}
      <motion.a
        href="https://wa.me/2349000000000"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.4 }}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-2xl shadow-lg transition-all hover:shadow-xl"
      >
        {/* WhatsApp SVG icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <div className="hidden sm:block">
          <p className="text-xs font-bold leading-tight">WhatsApp Support</p>
          <p className="text-[10px] text-green-100">Chat with us</p>
        </div>
      </motion.a>

      {/* Mobile sticky CTA bar */}
      <AnimatePresence>
        {showMobileBar && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3 }}
            className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex gap-3"
          >
            <Link
              href="/signup"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold"
            >
              <Users className="h-4 w-4" />
              Join Free
            </Link>
            <Link
              href="/lga-signup"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-green-700 text-green-700 text-sm font-semibold"
            >
              <Building2 className="h-4 w-4" />
              Register LGA
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
