import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata = { title: "LGA Verification Guide – 774ng.com" };

const steps = [
  { icon: ShieldCheck, title: "Register Your LGA",   desc: "The sitting LGA chairman completes the registration form with official contact details, office address, and chairman credentials." },
  { icon: Mail,        title: "Email Confirmation",  desc: "An OTP is sent to your official email address to verify ownership. Enter the code to activate your account." },
  { icon: Clock,       title: "Admin Review (48h)",  desc: "Our team reviews your submitted information against public LGA records. You will be notified by email within 48 business hours." },
  { icon: CheckCircle2,title: "Verified & Live",     desc: "Once approved, your LGA profile goes live with a Verified badge. You can immediately publish projects, list endowments, and respond to citizen feedback." },
];

export default function LGAVerifyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">LGA Verification Guide</h1>
          </div>
          <p className="text-slate-500 text-sm">How your LGA gets verified and published on the platform.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-6">The Verification Process</h2>
          <ol className="space-y-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-green-700" />
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-green-100 my-1" />}
                  </div>
                  <div className="pb-6">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">Step {i + 1}</p>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1">{s.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">What You&apos;ll Need</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {[
              "An official LGA email address (not personal Gmail/Yahoo)",
              "Full name and phone number of the sitting chairman",
              "Physical office address of the LGA secretariat",
              "Optional: Official LGA logo image (PNG/JPG, min 200×200px)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">What If My Application Is Rejected?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If your application cannot be verified with the information provided, you will receive an email explaining what additional information is needed. You can resubmit at any time. Common reasons for rejection include unverifiable contact details or a mismatch between the chairman name and official LGA records.
          </p>
        </section>

        <div className="text-center pt-4">
          <Link href="/lga-signup" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-colors shadow-sm">
            Start Registration <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-slate-400 mt-3">Free to register · 48h review · Verified badge on approval</p>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/how-it-works" className="hover:text-green-700 transition-colors">How It Works</Link>
          <Link href="/faqs"         className="hover:text-green-700 transition-colors">FAQs</Link>
          <Link href="/support"      className="hover:text-green-700 transition-colors">Support</Link>
          <Link href="/"             className="hover:text-green-700 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
