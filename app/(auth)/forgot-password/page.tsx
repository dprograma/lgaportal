"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, ArrowLeft, BadgeCheck, CheckCircle2 } from "lucide-react";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                <div className="p-8">
                  <div className="h-12 w-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
                    <Mail className="h-6 w-6 text-green-700" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-bold uppercase tracking-widest mb-4">
                    <BadgeCheck className="h-3 w-3" />Account Recovery
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Your Password?</h1>
                  <p className="text-sm text-slate-500 mb-6">
                    Enter the email address associated with your citizen account and we&apos;ll send you a secure reset link.
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="emeka@example.com"
                      leftIcon={<Mail className="h-4 w-4" />}
                      error={errors.email?.message}
                      autoComplete="email"
                      {...register("email")}
                    />

                    <Button type="submit" variant="primary" fullWidth loading={loading}>
                      Send Reset Link
                    </Button>
                  </form>

                  <div className="mt-6 flex justify-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />Back to Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                <div className="p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Reset Link Sent</h2>
                  <p className="text-slate-500 text-sm mb-2">
                    We&apos;ve sent a password reset link to
                  </p>
                  <p className="font-semibold text-slate-800 mb-2 break-all">{submittedEmail}</p>
                  <p className="text-xs text-slate-400 mb-7">
                    This link expires in 1 hour. Check your spam folder if you don&apos;t see it.
                  </p>
                  <div className="flex justify-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />Back to Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
