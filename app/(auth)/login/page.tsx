"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  Mail, Lock,
  Globe, TrendingUp, Users, Zap,
  ShieldCheck, BadgeCheck,
} from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations";
import { Input, PasswordInput } from "@/components/ui/input";
import Button from "@/components/ui/button";
import SocialLoginButtons from "@/components/auth/social-login-buttons";

// ─── Left panel data ───────────────────────────────────────────────────────

const panelStats = [
  { icon: Globe,       value: "774",   label: "Local Govt. Areas" },
  { icon: TrendingUp,  value: "36",    label: "States Covered"    },
  { icon: Users,       value: "200M+", label: "Citizens"          },
  { icon: Zap,         value: "Live",  label: "Real-time Data"    },
];

const trustPoints = [
  "Track federal allocations in real time",
  "Monitor LGA projects end-to-end",
  "Engage with your local government",
  "Secure, verified citizen platform",
];

// ─── Inner content (needs useSearchParams) ─────────────────────────────────

function LoginContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/profile";
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email:    data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "UNVERIFIED") {
          toast.info("Please verify your email first.");
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        if (result.error === "BANNED") {
          toast.error("Your account has been suspended. Contact support.");
          return;
        }
        toast.error("Invalid email or password. Please try again.");
        return;
      }

      // Send OTP then redirect to verify
      await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.email, purpose: "CITIZEN_LOGIN" }),
      });
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}&purpose=CITIZEN_LOGIN&next=${encodeURIComponent(callbackUrl)}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0">

      {/* ── Left: Official info panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 shrink-0 flex-col relative overflow-hidden bg-[#0f2d1a]">

        {/* Nigerian flag strip */}
        <div className="flex h-1.5 shrink-0">
          <div className="flex-1 bg-[#008751]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#008751]" />
        </div>

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-green-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col flex-1 p-10">

          {/* Official header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-[11px] font-semibold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Federal Republic of Nigeria
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Welcome Back to<br />
              <span className="text-green-400">LGA Portal</span>
            </h2>
            <p className="text-green-200/70 text-sm leading-relaxed">
              Sign in to continue tracking allocations, monitoring projects,
              and engaging with your local government.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {panelStats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <Icon className="h-4 w-4 text-green-400 mb-2" />
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-green-200/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Trust points */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-400/70 uppercase tracking-widest mb-4">
              What you get access to
            </p>
            <ul className="space-y-3">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-green-100/75 leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom security strip */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-600/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">256-bit SSL Encryption</p>
              <p className="text-[10px] text-green-200/50">Your data is safe and never sold</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Login form ─────────────────────────────────────────── */}
      <div className="lg:w-1/2 flex-1 overflow-y-auto bg-slate-50">
        <div className="w-[80%] mx-auto py-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >

            {/* Form header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-bold uppercase tracking-widest mb-4">
                <BadgeCheck className="h-3 w-3" />
                Official Citizen Sign In
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                Sign In to Your Account
              </h1>
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-green-700 font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Social login */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
              <p className="text-xs text-slate-500 text-center mb-3 font-medium">Quick sign-in via</p>
              <SocialLoginButtons callbackUrl={callbackUrl} />
            </div>

            {/* Credentials form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-6 space-y-5">

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="emeka@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={errors.email?.message}
                    autoComplete="email"
                    {...register("email")}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-green-700 hover:underline font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <PasswordInput
                      placeholder="Enter your password"
                      leftIcon={<Lock className="h-4 w-4" />}
                      error={errors.password?.message}
                      autoComplete="current-password"
                      {...register("password")}
                    />
                  </div>

                </div>

                {/* Submit footer */}
                <div className="px-6 pb-6">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    className="rounded-lg font-semibold tracking-wide"
                  >
                    Sign In to Portal
                  </Button>
                  <p className="text-[11px] text-slate-400 text-center mt-3">
                    By signing in you confirm this is your account. Your session is encrypted.
                  </p>
                </div>
              </form>
            </div>

            {/* LGA admin link */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Are you an LGA administrator?{" "}
              <Link href="/lga-login" className="text-green-700 hover:underline font-medium">
                LGA Sign In →
              </Link>
            </p>

          </motion.div>
        </div>
      </div>

    </div>
  );
}

// ─── Page export (Suspense wrapper required for useSearchParams) ────────────

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
