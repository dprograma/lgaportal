"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, XCircle, ArrowLeft, BadgeCheck } from "lucide-react";

import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";
import { PasswordInput } from "@/components/ui/input";
import Button from "@/components/ui/button";

function PasswordStrength({ password }: { password: string }) {
  const criteria = [
    { label: "8+ chars", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = criteria.filter((c) => c.met).length;
  const strength = metCount <= 1 ? 0 : metCount <= 2 ? 1 : metCount <= 3 ? 2 : metCount <= 4 ? 3 : 4;
  const barColors = ["bg-red-500", "bg-orange-400", "bg-amber-400", "bg-green-500", "bg-green-600"];
  const textColors = ["text-red-600", "text-orange-500", "text-amber-600", "text-green-600", "text-green-700"];
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  if (!password) return null;
  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength + 1 ? barColors[strength] : "bg-slate-100"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textColors[strength]}`}>{labels[strength]}</span>
        <div className="flex gap-2">
          {criteria.map((c) => (
            <span key={c.label} className={`text-[10px] flex items-center gap-0.5 ${c.met ? "text-green-600" : "text-slate-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.met ? "bg-green-500" : "bg-slate-300"}`} />
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LGAResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password", "");

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-300" />
            <div className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Invalid Reset Link</h2>
              <p className="text-slate-500 text-sm mb-6">
                This password reset link is invalid or has expired. Please request a new one to continue.
              </p>
              <Button variant="primary" fullWidth asChild>
                <Link href="/lga-forgot-password">Request New Link</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lga/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to reset password.");
        return;
      }
      toast.success("Password reset successfully! Please sign in.");
      router.push("/lga-login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
            <div className="p-8">
              <div className="h-12 w-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
                <Lock className="h-6 w-6 text-green-700" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-bold uppercase tracking-widest mb-4">
                <BadgeCheck className="h-3 w-3" />LGA Password Reset
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Set New LGA Password</h1>
              <p className="text-sm text-slate-500 mb-6">
                Create a strong password for your LGA administrator account.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <PasswordInput
                    label="New Password"
                    placeholder="Create a strong password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <PasswordStrength password={password} />
                </div>

                <PasswordInput
                  label="Confirm Password"
                  placeholder="Repeat your new password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />

                <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
                  Update Password
                </Button>
              </form>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/lga-login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LGAResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-slate-50"><div className="h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LGAResetPasswordContent />
    </Suspense>
  );
}
