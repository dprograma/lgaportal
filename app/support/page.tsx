import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Clock } from "lucide-react";

export const metadata = { title: "Support – 774ng.com LGA Portal" };

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Support</h1>
          <p className="text-slate-500 text-sm">We&apos;re here to help — choose the best channel for your query.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Channels */}
        <div className="grid sm:grid-cols-2 gap-5">
          <a href="mailto:support@774ng.com" className="block p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-green-400 hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Mail className="h-5 w-5 text-green-700" />
            </div>
            <h2 className="font-semibold text-slate-900 text-sm mb-1">Email Support</h2>
            <p className="text-xs text-slate-500 mb-3">General queries, account issues, billing, or data requests.</p>
            <span className="text-xs text-green-700 font-semibold">support@774ng.com →</span>
          </a>

          <a href="https://wa.me/2349000000000" target="_blank" rel="noopener noreferrer" className="block p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-green-400 hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <MessageCircle className="h-5 w-5 text-green-700" />
            </div>
            <h2 className="font-semibold text-slate-900 text-sm mb-1">WhatsApp Support</h2>
            <p className="text-xs text-slate-500 mb-3">Quick queries, LGA chairman assistance, and onboarding help.</p>
            <span className="text-xs text-green-700 font-semibold">Chat on WhatsApp →</span>
          </a>
        </div>

        {/* Response times */}
        <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Response Times</h3>
            <ul className="text-xs text-slate-600 space-y-1">
              <li><strong>Email:</strong> Within 24 business hours (Mon–Fri, 8am–6pm WAT)</li>
              <li><strong>WhatsApp:</strong> Typically within 2 hours during business hours</li>
              <li><strong>LGA Verification Queries:</strong> Within 48 business hours</li>
            </ul>
          </div>
        </div>

        {/* FAQ shortcut */}
        <div className="flex items-start gap-3 p-5 bg-green-50 border border-green-200 rounded-2xl">
          <HelpCircle className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Check the FAQs First</h3>
            <p className="text-xs text-slate-600 mb-3">Many common questions about accounts, LGA registration, investor inquiries, and data privacy are answered in our FAQ section.</p>
            <Link href="/faqs" className="text-xs text-green-700 font-semibold hover:underline">Browse FAQs →</Link>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/faqs"    className="hover:text-green-700 transition-colors">FAQs</Link>
          <Link href="/contact" className="hover:text-green-700 transition-colors">Contact Form</Link>
          <Link href="/"        className="hover:text-green-700 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
