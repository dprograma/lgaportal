"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LGAVerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email");
  const tokenParam = searchParams.get("token");

  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState(emailParam ?? "");

  const [verifyState, setVerifyState] = useState<"verifying" | "success" | "error">("verifying");
  const [verifyMessage, setVerifyMessage] = useState("");

  useEffect(() => {
    if (tokenParam) return;
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, tokenParam]);

  const verifyToken = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/lga/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (res.ok) {
        setVerifyState("success");
        setVerifyMessage("Your account is now active. Redirecting to sign in...");
        setTimeout(() => router.push("/lga-dashboard"), 2500);
      } else {
        setVerifyState("error");
        setVerifyMessage(json.error ?? "This verification link is invalid or has expired.");
      }
    } catch {
      setVerifyState("error");
      setVerifyMessage("Something went wrong. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    if (tokenParam) verifyToken(tokenParam);
  }, [tokenParam, verifyToken]);

  const handleResend = async () => {
    if (!email) { toast.error("Please enter your email address."); return; }
    setResendLoading(true);
    try {
      const res = await fetch("/api/lga/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Verification email sent! Please check your inbox.");
        setCountdown(60);
        setCanResend(false);
      } else {
        toast.error(json.error ?? "Failed to resend. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Token verification view
  if (tokenParam) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AnimatePresence mode="wait">
              {verifyState === "verifying" && (
                <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                    <div className="p-8 text-center">
                      <div className="h-16 w-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Your Email Address</h2>
                      <p className="text-slate-500 text-sm">Please wait while we confirm your identity.</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {verifyState === "success" && (
                <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                    <div className="p-8 text-center">
                      <div className="h-16 w-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Verified Successfully</h2>
                      <p className="text-slate-500 text-sm">{verifyMessage}</p>
                      <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mt-4 text-left">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">Your LGA registration is now pending admin review (3–5 business days) before activation.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {verifyState === "error" && (
                <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-300" />
                    <div className="p-8 text-center">
                      <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
                        <XCircle className="h-8 w-8 text-red-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h2>
                      <p className="text-slate-500 text-sm mb-6">{verifyMessage}</p>
                      <Button variant="primary" fullWidth asChild>
                        <a href="/lga-verify-email">Request New Link</a>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    );
  }

  // Check-inbox view (no token)
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
            <div className="p-8">
              <div className="h-12 w-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
                <Mail className="h-6 w-6 text-green-700" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-bold uppercase tracking-widest mb-4">
                <BadgeCheck className="h-3 w-3" />LGA Email Verification
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email Address</h1>
              <p className="text-sm text-slate-500 mb-1">
                We sent a verification link to:
              </p>
              {emailParam && (
                <p className="font-semibold text-slate-800 mb-4 break-all">{emailParam}</p>
              )}

              <div className="flex gap-2 p-3 rounded-lg bg-green-50 border border-green-200 mb-3 text-left">
                <Mail className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">Check your inbox and spam folder. The link expires in 24 hours.</p>
              </div>

              <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-5 text-left">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">After verifying your email, your LGA account will be reviewed by our admin team before activation (3–5 business days).</p>
              </div>

              <div className="space-y-3">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@lga.gov.ng"
                />

                {canResend ? (
                  <Button
                    variant="primary"
                    fullWidth
                    loading={resendLoading}
                    onClick={handleResend}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Resend Verification Email
                  </Button>
                ) : (
                  <div className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <span className="font-mono font-bold text-slate-700">0:{String(countdown).padStart(2, "0")}</span>
                    <span>before you can resend</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <p className="text-xs text-slate-400">
                  Wrong email?{" "}
                  <a href="/lga-signup" className="text-green-700 hover:underline font-medium">
                    Go back to registration
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LGAVerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    }>
      <LGAVerifyEmailContent />
    </Suspense>
  );
}
