"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User, Mail, Phone, MapPin, Lock,
  ShieldCheck, BadgeCheck, Globe, Users, TrendingUp,
} from "lucide-react";

import { signUpSchema, type SignUpInput } from "@/lib/validations";
import { NIGERIA_STATES } from "@/lib/utils";
import { Input, PasswordInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Button from "@/components/ui/button";
import SocialLoginButtons from "@/components/auth/social-login-buttons";

// ─── Password strength meter ───────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const criteria = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = criteria.filter((c) => c.met).length;
  const strength = metCount <= 1 ? 0 : metCount <= 2 ? 1 : metCount <= 3 ? 2 : metCount <= 4 ? 3 : 4;
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const barColors = ["bg-red-500", "bg-orange-400", "bg-amber-400", "bg-green-500", "bg-green-600"];
  const textColors = ["text-red-600", "text-orange-500", "text-amber-600", "text-green-600", "text-green-700"];

  if (!password) return null;

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength + 1 ? barColors[strength] : "bg-slate-100"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textColors[strength]}`}>
          {labels[strength]}
        </span>
        <div className="flex gap-2.5">
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

// ─── Form section divider ──────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span className="text-green-700">{icon}</span>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─── Left panel stats ──────────────────────────────────────────────────────

const panelStats = [
  { icon: Globe, value: "774", label: "Local Govt. Areas" },
  { icon: TrendingUp, value: "36", label: "States Covered" },
  { icon: Users, value: "200M+", label: "Nigerian Citizens" },
  { icon: BadgeCheck, value: "Free", label: "For All Citizens" },
];

const trustPoints = [
  "Real-time federal allocation transparency",
  "Track projects from planning to completion",
  "Submit reports & engage your representatives",
  "Official data verified by government sources",
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { terms: false },
  });

  const password = watch("password", "");

  const onSubmit = async (data: SignUpInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Registration failed. Please try again.");
        return;
      }
      toast.success("Account created! Please verify your email.");
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
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

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        {/* Decorative glows */}
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
              LGA Citizen<br />
              <span className="text-green-400">Portal</span>
            </h2>
            <p className="text-green-200/70 text-sm leading-relaxed">
              Nigeria&apos;s official platform for local government transparency,
              federal allocation tracking, and citizen participation.
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
              <p className="text-[10px] text-green-200/50">Your data is protected and never sold</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Registration form ──────────────────────────────────── */}
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
                Official Citizen Registration
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                Create Your Citizen Account
              </h1>
              <p className="text-sm text-slate-500">
                Already registered?{" "}
                <Link href="/login" className="text-green-700 font-semibold hover:underline">
                  Sign in to your account →
                </Link>
              </p>
            </div>

            {/* Social login */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
              <p className="text-xs text-slate-500 text-center mb-3 font-medium">Quick registration via</p>
              <SocialLoginButtons callbackUrl="/profile" />
            </div>

            {/* Credentials form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />

              <div className="p-6 space-y-5">

                {/* Section A: Personal */}
                <SectionLabel icon={<User className="h-3.5 w-3.5" />} label="Personal Information" />

                <Input
                  label="Full Name"
                  placeholder="e.g. Emeka Obiora"
                  leftIcon={<User className="h-4 w-4" />}
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="emeka@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="08012345678 (optional)"
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                {/* Section B: Location */}
                <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />} label="Location" />

                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="State of Residence"
                        placeholder="Select state"
                        error={errors.state?.message}
                        {...field}
                      >
                        {NIGERIA_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                    )}
                  />
                  <Input
                    label="LGA"
                    placeholder="Your LGA"
                    leftIcon={<MapPin className="h-4 w-4" />}
                    error={errors.lga?.message}
                    {...register("lga")}
                  />
                </div>

                {/* Section C: Security */}
                <SectionLabel icon={<Lock className="h-3.5 w-3.5" />} label="Security Credentials" />

                <div className="space-y-1">
                  <PasswordInput
                    label="Password"
                    placeholder="Create a strong password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <PasswordStrength password={password} />
                </div>
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />

                {/* Terms */}
                <div className="pt-1">
                  <Controller
                    name="terms"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label={
                          <span className="text-sm text-slate-600">
                            I have read and agree to the{" "}
                            <Link href="/terms" className="text-green-700 font-medium hover:underline" target="_blank">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-green-700 font-medium hover:underline" target="_blank">
                              Privacy Policy
                            </Link>
                          </span>
                        }
                        error={errors.terms?.message}
                        checked={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
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
                  onClick={handleSubmit(onSubmit)}
                  className="rounded-lg font-semibold tracking-wide"
                >
                  Register as Citizen
                </Button>
                <p className="text-[11px] text-slate-400 text-center mt-3">
                  By registering you confirm this is your official information.
                  A verification email will be sent after registration.
                </p>
              </div>
            </div>

          </motion.div>
        </div>
      </div>

    </div>
  );
}
