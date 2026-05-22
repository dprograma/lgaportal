"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Mail, Phone, MapPin, Clock, Send, CheckCircle2,
  AlertCircle, ChevronRight, MessageSquare,
} from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email:    z.email("Please enter a valid email address"),
  subject:  z.string().min(1, "Please select a subject"),
  message:  z.string().min(20, "Message must be at least 20 characters"),
});

type FormValues = z.infer<typeof schema>;

const SUBJECTS = [
  "General Enquiry",
  "LGA Registration Support",
  "Technical Issue / Bug Report",
  "Investment & Partnerships",
  "Data Correction Request",
  "Media & Press",
  "Other",
];

const contactInfo = [
  {
    icon: Mail,
    label: "Email Us",
    value: "support@lgaportal.ng",
    href: "mailto:support@lgaportal.ng",
    sub: "We reply within 1–2 business days",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+234 800 LGA PORT",
    href: "tel:+2348005427678",
    sub: "Mon – Fri, 8 am – 5 pm WAT",
  },
  {
    icon: MapPin,
    label: "Head Office",
    value: "Zone 5, Abuja, FCT",
    href: "https://maps.google.com/?q=Abuja+FCT+Nigeria",
    sub: "Federal Capital Territory, Nigeria",
  },
  {
    icon: Clock,
    label: "Working Hours",
    value: "Mon – Fri: 8 am – 5 pm",
    href: null,
    sub: "Closed weekends & public holidays",
  },
];

const faqs = [
  {
    q: "How do I register my LGA?",
    a: "Click 'Get Started → Register Your LGA' on the homepage and complete the verification form. Admin approval takes 3–5 business days.",
  },
  {
    q: "Is the platform free for citizens?",
    a: "Yes — citizens can browse LGA profiles, wards, and projects completely free.",
  },
  {
    q: "How do I report incorrect LGA data?",
    a: "Use this contact form with subject 'Data Correction Request' and describe the issue. Our team will verify and update the record.",
  },
  {
    q: "How do investors connect with LGAs?",
    a: "Register as an investor via the Invest page, and our team will match you with LGAs aligned with your sectors of interest.",
  },
];

export default function ContactPage() {
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", subject: "", message: "" },
  });

  async function onSubmit(data: FormValues) {
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
      reset();
    } catch {
      setServerError("Network error — please check your connection and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium">Contact</span>
          </div>
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4">
              Get in Touch
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              We&apos;re here to help
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Have a question about your LGA, a technical issue, or want to explore
              partnership opportunities? Send us a message and we&apos;ll get back to
              you promptly.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

          {/* ── Left column: form ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Send us a message</h2>
                  <p className="text-sm text-slate-500">All fields are required</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center py-12 px-4"
                  >
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent!</h3>
                    <p className="text-slate-500 text-sm max-w-sm mb-6">
                      Thanks for reaching out. We&apos;ve sent a confirmation to your inbox
                      and will reply within 1–2 business days.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="space-y-5"
                  >
                    {/* Name + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Full Name
                        </label>
                        <input
                          {...register("fullName")}
                          placeholder="Chukwuemeka Eze"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            errors.fullName
                              ? "border-red-400 focus:ring-red-200"
                              : "border-slate-200 focus:border-green-500 focus:ring-green-100"
                          }`}
                        />
                        {errors.fullName && (
                          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Email Address
                        </label>
                        <input
                          {...register("email")}
                          type="email"
                          placeholder="you@example.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            errors.email
                              ? "border-red-400 focus:ring-red-200"
                              : "border-slate-200 focus:border-green-500 focus:ring-green-100"
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Subject
                      </label>
                      <select
                        {...register("subject")}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all bg-white ${
                          errors.subject
                            ? "border-red-400 focus:ring-red-200"
                            : "border-slate-200 focus:border-green-500 focus:ring-green-100"
                        }`}
                      >
                        <option value="">Select a subject…</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.subject && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        {...register("message")}
                        rows={6}
                        placeholder="Describe your enquiry in detail…"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                          errors.message
                            ? "border-red-400 focus:ring-red-200"
                            : "border-slate-200 focus:border-green-500 focus:ring-green-100"
                        }`}
                      />
                      {errors.message && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    {/* Server error */}
                    {serverError && (
                      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {serverError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right column: info + FAQ ── */}
          <div className="space-y-6">
            {/* Contact cards */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-5">Contact Information</h2>
              <div className="space-y-5">
                {contactInfo.map(({ icon: Icon, label, value, href, sub }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-green-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-slate-800 hover:text-green-700 transition-colors"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800">{value}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ accordion */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Common Questions</h2>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <span className="pr-3">{faq.q}</span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                          openFaq === i ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
