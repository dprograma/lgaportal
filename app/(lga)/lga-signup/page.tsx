"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2, Mail, Phone, MapPin, Lock, Users,
  ShieldCheck, BadgeCheck, CheckCircle2, ChevronRight, ChevronLeft,
  FileText, Landmark, KeyRound,
} from "lucide-react";

import { lgaSignUpSchema, type LGASignUpInput } from "@/lib/validations";
import { NIGERIA_STATES, LGA_SECTORS } from "@/lib/utils";
import { Input, PasswordInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Button from "@/components/ui/button";

// ─── Password strength ─────────────────────────────────────────────────────

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
  const colors = ["bg-red-500", "bg-orange-400", "bg-amber-400", "bg-green-500", "bg-green-600"];
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const textColors = ["text-red-600", "text-orange-500", "text-amber-600", "text-green-600", "text-green-700"];
  if (!password) return null;
  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength + 1 ? colors[strength] : "bg-slate-100"}`} />
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

// ─── Step configuration ────────────────────────────────────────────────────

const STEPS = [
  {
    id: "A",
    title: "LGA Identification",
    subtitle: "Official LGA details and administrator contact",
    icon: Landmark,
  },
  {
    id: "B",
    title: "Service Information",
    subtitle: "Sectors served and LGA overview",
    icon: FileText,
  },
  {
    id: "C",
    title: "Administrator Credentials",
    subtitle: "Secure access credentials and final confirmation",
    icon: KeyRound,
  },
];

// ─── Section label ─────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <span className="text-green-700">{icon}</span>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LGASignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<LGASignUpInput>({
    resolver: zodResolver(lgaSignUpSchema),
    defaultValues: { sectors: [], terms: false },
  });

  const password = watch("password", "");
  const sectors = watch("sectors", []);

  const step0Fields: (keyof LGASignUpInput)[] = ["lgaName", "state", "chairmanName", "email", "phone", "officeAddress"];
  const step1Fields: (keyof LGASignUpInput)[] = ["sectors"];

  const handleNext = async () => {
    const fields = step === 0 ? step0Fields : step === 1 ? step1Fields : [];
    const valid = await trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: LGASignUpInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lga/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Registration failed. Please try again.");
        return;
      }
      toast.success("LGA registered! Please verify your email.");
      router.push(`/lga-verify-email?email=${encodeURIComponent(data.email)}`);
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

        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-green-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-64 h-64 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col flex-1 p-10">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-[11px] font-semibold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Federal Republic of Nigeria
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              LGA Administrator<br />
              <span className="text-green-400">Registration Portal</span>
            </h2>
            <p className="text-green-200/70 text-sm leading-relaxed">
              Register your Local Government Area on the official transparency
              platform. Publish allocations, manage projects, and engage citizens.
            </p>
          </div>

          {/* Step preview on panel */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-green-400/70 uppercase tracking-widest mb-4">
              Application Sections
            </p>
            <div className="space-y-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isComplete = i < step;
                const isCurrent = i === step;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                      isCurrent ? "bg-white/10 border border-white/20" : "opacity-60"
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isComplete ? "bg-green-600" : isCurrent ? "bg-green-700" : "bg-white/10"
                    }`}>
                      {isComplete
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : <Icon className="h-4 w-4 text-white/80" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Section {s.id} &mdash; {s.title}
                      </p>
                      <p className="text-[10px] text-green-200/60">{s.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trust points */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-400/70 uppercase tracking-widest mb-3">
              Platform benefits
            </p>
            <ul className="space-y-2.5">
              {[
                "Publish allocation & expenditure reports",
                "Manage and track LGA projects end-to-end",
                "Receive citizen feedback and priority votes",
                "Subject to admin review before activation",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-green-100/70 leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-600/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Official Government Platform</p>
              <p className="text-[10px] text-green-200/50">All LGA registrations are verified by admin review</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Multi-step form ────────────────────────────────────── */}
      <div className="lg:w-1/2 flex-1 overflow-y-auto bg-slate-50">
        <div className="w-[80%] mx-auto py-10">

          {/* Page header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-bold uppercase tracking-widest mb-4">
              <BadgeCheck className="h-3 w-3" />
              Official LGA Registration
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
              LGA Administrator Application
            </h1>
            <p className="text-sm text-slate-500">
              Already registered?{" "}
              <Link href="/lga-login" className="text-green-700 font-semibold hover:underline">
                Sign in to your LGA account →
              </Link>
            </p>
          </div>

          {/* Progress tracker */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => {
                const isComplete = i < step;
                const isCurrent = i === step;
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isComplete
                          ? "bg-green-600 text-white"
                          : isCurrent
                          ? "bg-green-700 text-white ring-4 ring-green-100"
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                      </div>
                      <p className={`text-[10px] font-semibold mt-1.5 text-center leading-tight ${
                        isCurrent ? "text-green-700" : isComplete ? "text-green-600" : "text-slate-400"
                      }`}>
                        {s.title}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-5 mx-2 transition-all duration-300 ${i < step ? "bg-green-500" : "bg-slate-100"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Step {step + 1} of {STEPS.length} &mdash; {STEPS[step].subtitle}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6">

                {/* Step header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  {(() => {
                    const Icon = STEPS[step].icon;
                    return (
                      <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-green-700" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                      Section {STEPS[step].id}
                    </p>
                    <h2 className="text-base font-bold text-slate-900">{STEPS[step].title}</h2>
                  </div>
                </div>

                <AnimatePresence mode="wait">

                  {/* ── STEP 0: LGA Identification ─────────────────── */}
                  {step === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <SectionLabel icon={<Building2 className="h-3.5 w-3.5" />} label="LGA Details" />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="LGA Name"
                          placeholder="e.g. Lagos Island"
                          leftIcon={<Building2 className="h-4 w-4" />}
                          error={errors.lgaName?.message}
                          {...register("lgaName")}
                        />
                        <Controller
                          name="state"
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="State"
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
                      </div>

                      <SectionLabel icon={<Users className="h-3.5 w-3.5" />} label="Chairman / Administrator" />

                      <Input
                        label="Chairman's Full Name"
                        placeholder="e.g. Alhaji Musa Abubakar"
                        leftIcon={<Users className="h-4 w-4" />}
                        error={errors.chairmanName?.message}
                        {...register("chairmanName")}
                      />
                      <Input
                        label="Official Email Address"
                        type="email"
                        placeholder="chairman@lgamail.gov.ng"
                        leftIcon={<Mail className="h-4 w-4" />}
                        error={errors.email?.message}
                        {...register("email")}
                      />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Phone Number"
                          type="tel"
                          placeholder="08012345678"
                          leftIcon={<Phone className="h-4 w-4" />}
                          error={errors.phone?.message}
                          {...register("phone")}
                        />
                        <Input
                          label="Office Address"
                          placeholder="LGA Secretariat, ..."
                          leftIcon={<MapPin className="h-4 w-4" />}
                          error={errors.officeAddress?.message}
                          {...register("officeAddress")}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 1: Service Information ─────────────────── */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <Input
                        label="Estimated Population (optional)"
                        placeholder="e.g. 350,000"
                        leftIcon={<Users className="h-4 w-4" />}
                        {...register("population")}
                      />

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-slate-700">
                            Key Service Sectors
                          </label>
                          <span className="text-xs text-slate-400">
                            {sectors.length} selected
                          </span>
                        </div>
                        {errors.sectors && (
                          <p className="text-xs text-red-500 mb-2">{errors.sectors.message}</p>
                        )}
                        <Controller
                          name="sectors"
                          control={control}
                          render={({ field }) => (
                            <div className="grid grid-cols-2 gap-2">
                              {LGA_SECTORS.map((sector) => {
                                const checked = field.value.includes(sector);
                                return (
                                  <label
                                    key={sector}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                      checked
                                        ? "border-green-400 bg-green-50 text-green-800"
                                        : "border-slate-200 hover:border-green-300 hover:bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                      checked ? "bg-green-600 border-green-600" : "border-slate-300"
                                    }`}>
                                      {checked && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                    </span>
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          field.onChange([...field.value, sector]);
                                        } else {
                                          field.onChange(field.value.filter((v: string) => v !== sector));
                                        }
                                      }}
                                    />
                                    <span className="text-xs font-medium">{sector}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">
                          LGA Overview{" "}
                          <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          placeholder="Brief description of your LGA — its geography, key projects, or governance focus..."
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none hover:border-slate-300"
                          {...register("description")}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 2: Credentials ──────────────────────────── */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Review notice */}
                      <div className="flex gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                        <BadgeCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          After email verification, your LGA account will be reviewed by our admin team
                          within <strong>3–5 business days</strong> before activation on the platform.
                        </p>
                      </div>

                      <SectionLabel icon={<Lock className="h-3.5 w-3.5" />} label="Access Credentials" />

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

                      <div className="pt-1">
                        <Controller
                          name="terms"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              label={
                                <span className="text-sm text-slate-600">
                                  I confirm that I am an authorised representative of this LGA and agree to the{" "}
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
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Navigation footer */}
              <div className="px-6 pb-6 flex gap-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    fullWidth
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Back
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={handleNext}
                  >
                    Continue to Section {STEPS[step + 1].id}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    className="font-semibold tracking-wide"
                  >
                    Submit LGA Application
                  </Button>
                )}
              </div>

            </form>
          </div>

          {step === 0 && (
            <p className="text-center text-xs text-slate-400 mt-4">
              This is an official registration process.
              All submitted information is subject to verification.
            </p>
          )}

        </div>
      </div>

    </div>
  );
}
