"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, LogIn } from "lucide-react";

interface Props {
  open:    boolean;
  onClose: () => void;
  action?: string;
}

export default function LoginPromptModal({ open, onClose, action = "interact with posts" }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-green-700" />
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1.5">Login Required</h3>
              <p className="text-sm text-slate-500 mb-5">
                You need to be logged in to {action}. Join thousands of citizens already engaging
                with their local governments.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold text-center transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:border-green-400 text-slate-700 text-sm font-semibold text-center transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
