import Link from "next/link";
import { ShieldCheck, FileText, Clock, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

export const metadata = { title: "LGA Verification Guide – 774ng.com" };

const steps = [
  {
    icon: FileText,
    title: "Register Your LGA",
    desc: "The sitting LGA chairman or their designated digital officer creates an account at /lga-signup using the official LGA contact details.",
    note: "Use the email address on official LGA letterhead where possible.",
  },
  {
    icon: ShieldCheck,
    title: "Verify Your Email",
    desc: "A one-time passcode (OTP) is sent to the registered email. Enter it to confirm the email address belongs to you.",
    note: null,
  },
  {
    icon: FileText,
    title: "Submit Supporting Documents",
    desc: "Upload your Certificate of Return (or appointment letter), a letter of authority on official LGA letterhead, and a government-issued ID.",
    note: "Documents should be less than 5MB each and in PDF or image format.",
  },
  {
    icon: Clock,
    title: "Await Admin Review",
    desc: "Our team reviews your documents within 2–5 business days. You will receive an email when the review is complete.",
    note: "You can still access your dashboard during review — some features are unlocked after verification.",
  },
  {
    icon: CheckCircle2,
    title: "Get Your Verified Badge",
    desc: "Once approved, your LGA profile shows a Verified badge visible to all citizens and investors on the platform.",
    note: null,
  },
];

const docs = [
  { label: "Certificate of Return / Appointment Letter", required: true },
  { label: "Letter of Authority on official LGA letterhead", required: true },
  { label: "Government-issued ID (National ID, Passport, or Driver's Licence)", required: true },
  { label: "LGA official seal or stamp (if available)", required: false },
  { label: "Council resolution authorising digital presence (optional but recommended)", required: false },
];

export default function LGAVerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-green-900 to-slate-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-green-300 text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck className="h-3.5 w-3.5" /> LGA Verification
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Get Your LGA Verified</h1>
          <p className="text-slate-300 max-w-xl mx-auto leading-relaxed">
            Verified LGAs earn a trust badge that signals to investors and citizens that your
            administration is legitimate, transparent, and serious about development.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-12">

        {/* Steps */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-8">Verification Process</h2>
          <div className="relative border-l-2 border-green-200 pl-8 space-y-8">
            {steps.map(({ icon: Icon, title, desc, note }, i) => (
              <div key={title} className="relative">
                <div className="absolute -left-[41px] h-8 w-8 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold shadow">
                  {i + 1}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-green-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-green-600" />
                    <h3 className="font-bold text-slate-900">{title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                  {note && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{note}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Required documents */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" /> Required Documents
          </h2>
          <ul className="space-y-3">
            {docs.map(({ label, required }) => (
              <li key={label} className="flex items-start gap-3">
                <span className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${required ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {required ? "✓" : "○"}
                </span>
                <div>
                  <span className="text-sm text-slate-700">{label}</span>
                  {!required && <span className="ml-2 text-xs text-slate-400">(optional)</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-5">Benefits of Verification</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: "🏅", title: "Verified Badge",    desc: "A trust signal displayed on your LGA profile, visible to all visitors." },
              { icon: "📈", title: "Investor Trust",    desc: "Investors are more likely to submit inquiries to verified LGAs." },
              { icon: "🔓", title: "Full Feature Access", desc: "Unlock all dashboard features, including staff management and analytics." },
            ].map((b) => (
              <div key={b.title} className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
                <div className="text-2xl mb-2">{b.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{b.title}</h3>
                <p className="text-xs text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link href="/lga-signup" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-base transition-all shadow-md">
            Start Registration <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-sm text-slate-400 mt-3">Questions? Email <a href="mailto:support@774ng.com" className="text-green-700 underline">support@774ng.com</a></p>
        </div>
      </div>
    </div>
  );
}
