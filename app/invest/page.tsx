"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, Wheat, Gem, Beef, Fish, TreePine, Zap, Palmtree, Factory,
  BadgeCheck, ArrowRight, CheckCircle2, MapPin, Building2, Globe,
} from "lucide-react";

/* ─── Zod schema ─────────────────────────────────────────────────────────── */
const schema = z.object({
  fullName:    z.string().min(2, "Full name is required"),
  email:       z.string().email("Enter a valid email address"),
  phone:       z.string().optional(),
  company:     z.string().optional(),
  country:     z.string().min(2, "Country is required"),
  sectors:     z.array(z.string()).min(1, "Select at least one sector"),
  minBudget:   z.string().optional(),
  maxBudget:   z.string().optional(),
  description: z.string().max(1000).optional(),
});
type FormValues = z.infer<typeof schema>;

/* ─── Sector options ─────────────────────────────────────────────────────── */
const sectors = [
  { id: "AGRICULTURE",   label: "Agriculture",    icon: Wheat    },
  { id: "MINERALS",      label: "Solid Minerals", icon: Gem      },
  { id: "LIVESTOCK",     label: "Livestock",      icon: Beef     },
  { id: "FISHERIES",     label: "Fisheries",      icon: Fish     },
  { id: "FORESTRY",      label: "Forestry",       icon: TreePine },
  { id: "ENERGY",        label: "Energy",         icon: Zap      },
  { id: "TOURISM",       label: "Tourism",        icon: MapPin   },
  { id: "MANUFACTURING", label: "Manufacturing",  icon: Factory  },
];

const budgetRanges = [
  "Below ₦100M", "₦100M – ₦500M", "₦500M – ₦1B",
  "₦1B – ₦5B", "₦5B – ₦20B", "Above ₦20B",
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function InvestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sectors: [] },
  });

  const selectedSectors = watch("sectors");

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    try {
      const res = await fetch("/api/investors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Something went wrong."); return; }
      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  };

  /* ── Success screen ─────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#071a0e] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-10 max-w-md w-full text-center"
        >
          <div className="h-16 w-16 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Profile Received</h2>
          <p className="text-green-200/60 text-sm leading-relaxed mb-6">
            Thank you for registering as an investor on LGA Portal. Our team will
            review your profile and match you with suitable LGAs within 2–3 business
            days. Check your inbox for a confirmation email.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all"
          >
            Back to Home <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ── Main form ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#071a0e] flex flex-col lg:flex-row">

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-10 lg:p-14 overflow-hidden">
        {/* Nigerian flag strip */}
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#008751]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#008751]" />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-green-300 text-sm mb-12 hover:text-white transition-colors">
            ← Back to LGA Portal
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-green-300 text-xs font-bold uppercase tracking-widest mb-6">
            <TrendingUp className="h-3.5 w-3.5" />
            Investor Registration
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            Unlock Nigeria&apos;s{" "}
            <span className="text-green-400">Local Investment</span>{" "}
            Opportunities
          </h1>
          <p className="text-green-200/60 text-sm leading-relaxed mb-10 max-w-md">
            Register your investor profile and we&apos;ll connect you directly
            with verified LGA administrations whose natural endowments match
            your sector and budget.
          </p>

          {/* Value props */}
          <div className="space-y-4">
            {[
              { icon: BadgeCheck,  text: "Matched with verified LGA opportunities" },
              { icon: Building2,   text: "Direct line to LGA chairman & investment desk" },
              { icon: Globe,       text: "Access 774 LGAs across all 36 states" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-600/20 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-white/25 mt-10">
          © {new Date().getFullYear()} LGA Portal · Federal Republic of Nigeria
        </p>
      </div>

      {/* ── Right panel (form) ───────────────────────────────────────── */}
      <div className="lg:w-1/2 bg-slate-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-[80%] mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />

            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Investor Profile
              </h2>
              <p className="text-xs text-slate-500 mb-7">
                Complete the form below. All fields marked * are required.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Full name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    {...register("fullName")}
                    placeholder="e.g. Amina Ibrahim"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                  />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                </div>

                {/* Email + Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address *</label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="investor@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="+234 800 000 0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                </div>

                {/* Company + Country */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company / Organisation</label>
                    <input
                      {...register("company")}
                      placeholder="ABC Holdings Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country of Origin *</label>
                    <input
                      {...register("country")}
                      placeholder="Nigeria"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                    {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>}
                  </div>
                </div>

                {/* Sectors */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Investment Sectors * <span className="font-normal text-slate-400">(select all that apply)</span>
                  </label>
                  <Controller
                    name="sectors"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {sectors.map(({ id, label, icon: Icon }) => {
                          const checked = field.value.includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  checked
                                    ? field.value.filter((v) => v !== id)
                                    : [...field.value, id]
                                )
                              }
                              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                                checked
                                  ? "bg-green-700 border-green-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.sectors && <p className="text-xs text-red-500 mt-1">{errors.sectors.message}</p>}
                </div>

                {/* Budget range */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Minimum Budget</label>
                    <select
                      {...register("minBudget")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    >
                      <option value="">Select range</option>
                      {budgetRanges.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Maximum Budget</label>
                    <select
                      {...register("maxBudget")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    >
                      <option value="">Select range</option>
                      {budgetRanges.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Investment brief */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Investment Brief <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Briefly describe your investment interest, specific resources you are looking for, or any conditions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none"
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>

                {serverError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {serverError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Submitting…" : (
                    <>Submit Investor Profile <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Already registered?{" "}
                  <Link href="/lgas?tab=investment" className="text-green-700 font-medium hover:underline">
                    Browse LGA opportunities
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
