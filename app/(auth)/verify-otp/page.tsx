"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function OTPForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get("email") ?? "";
  const purpose      = searchParams.get("purpose") ?? "CITIZEN_LOGIN";
  const next         = searchParams.get("next") ?? (purpose === "LGA_LOGIN" ? "/lga-dashboard" : "/");

  const lgaId = searchParams.get("lgaId") ?? "";

  const [digits,    setDigits]    = useState<string[]>(Array(6).fill(""));
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown,  setCooldown]  = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");
  const [locked,    setLocked]    = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (idx: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError("");
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
    // Auto-submit when all 6 filled
    if (char && idx === 5 && next.every(Boolean)) {
      submitOTP(next.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split("");
      setDigits(arr);
      inputRefs.current[5]?.focus();
      submitOTP(pasted);
    }
  };

  const submitOTP = useCallback(async (code: string) => {
    if (loading || locked) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/otp/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: email, code, purpose }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.locked) setLocked(true);
        setError(data.error ?? "Verification failed.");
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      // For LGA login: store lgaId in sessionStorage so the dashboard can identify this session
      if (purpose === "LGA_LOGIN" && lgaId) {
        sessionStorage.setItem("lgaId", lgaId);
      }

      setSuccess(true);
      toast.success("Identity verified!");
      setTimeout(() => router.push(next), 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, purpose, next, lgaId, loading, locked, router]);

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError("");
    try {
      const res  = await fetch("/api/otp/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to resend."); return; }
      toast.success("New OTP sent to your email.");
      setCooldown(60);
      setCanResend(false);
      setLocked(false);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 items-center justify-center bg-slate-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Verified!</h2>
              <p className="text-slate-500 text-sm">Redirecting you now…</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />

              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${locked ? "bg-red-100" : "bg-green-100"}`}>
                    {locked
                      ? <Lock className="h-7 w-7 text-red-600" />
                      : <ShieldCheck className="h-7 w-7 text-green-700" />
                    }
                  </div>
                </div>

                <h1 className="text-xl font-bold text-slate-900 text-center mb-1">
                  {locked ? "Account Locked" : "Verify Your Identity"}
                </h1>
                <p className="text-sm text-slate-500 text-center mb-6">
                  {locked
                    ? "Too many failed attempts. Request a new code to continue."
                    : <>We sent a 6-digit code to<br /><strong className="text-slate-700">{email}</strong></>
                  }
                </p>

                {!locked && (
                  <>
                    {/* OTP inputs */}
                    <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                      {digits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { inputRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) => handleChange(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(i, e)}
                          disabled={loading}
                          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
                            ${error ? "border-red-400 bg-red-50" : d ? "border-green-500 bg-green-50" : "border-slate-200 bg-white"}
                            focus:border-green-500 focus:ring-2 focus:ring-green-100
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                          style={{ width: "2.75rem", height: "3.25rem" }}
                        />
                      ))}
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      onClick={() => submitOTP(digits.join(""))}
                      disabled={digits.some((d) => !d) || loading}
                      className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                      {loading ? "Verifying…" : "Verify Code"}
                    </button>
                  </>
                )}

                {/* Resend */}
                <div className="mt-4 text-center">
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 font-medium transition-colors"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                      {resending ? "Sending…" : "Resend Code"}
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Resend available in <span className="font-semibold text-slate-600">{cooldown}s</span>
                    </p>
                  )}
                </div>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Code expires in 5 minutes.{" "}
                  <Link href={purpose === "LGA_LOGIN" ? "/lga-login" : "/login"} className="text-green-700 hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense>
      <OTPForm />
    </Suspense>
  );
}
