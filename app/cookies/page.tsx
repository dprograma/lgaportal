import Link from "next/link";
import { Cookie, ArrowLeft } from "lucide-react";

export const metadata = { title: "Cookie Policy – 774ng.com LGA Portal" };

const EFFECTIVE_DATE = "1 July 2026";

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Cookie className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Cookie Policy</h1>
          </div>
          <p className="text-sm text-slate-500">
            Effective Date: <strong>{EFFECTIVE_DATE}</strong>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        <Section title="What Are Cookies?">
          <p>
            Cookies are small text files placed on your device when you visit a website. They allow
            the website to recognise your device across pages and sessions. We only set the cookies
            necessary to operate and improve the Platform.
          </p>
        </Section>

        <Section title="Cookies We Use">
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-3 py-2 font-semibold text-slate-700 rounded-tl-lg border border-slate-200">Name</th>
                  <th className="px-3 py-2 font-semibold text-slate-700 border border-slate-200">Type</th>
                  <th className="px-3 py-2 font-semibold text-slate-700 border border-slate-200">Purpose</th>
                  <th className="px-3 py-2 font-semibold text-slate-700 rounded-tr-lg border border-slate-200">Duration</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="px-3 py-2 border border-slate-200 font-mono">admin_session</td>
                  <td className="px-3 py-2 border border-slate-200">Essential</td>
                  <td className="px-3 py-2 border border-slate-200">Authenticates admin users. HttpOnly, Secure.</td>
                  <td className="px-3 py-2 border border-slate-200">Session</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-3 py-2 border border-slate-200 font-mono">__next_*</td>
                  <td className="px-3 py-2 border border-slate-200">Essential</td>
                  <td className="px-3 py-2 border border-slate-200">Next.js framework internals (routing, prefetch).</td>
                  <td className="px-3 py-2 border border-slate-200">Session</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-slate-200 font-mono">_analytics</td>
                  <td className="px-3 py-2 border border-slate-200">Analytics</td>
                  <td className="px-3 py-2 border border-slate-200">Anonymised usage data. Does not identify you personally.</td>
                  <td className="px-3 py-2 border border-slate-200">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            We do <strong>not</strong> use advertising cookies, cross-site tracking cookies, or
            cookies from social media platforms.
          </p>
        </Section>

        <Section title="Your Choices">
          <p>
            Essential cookies cannot be disabled — the Platform will not function correctly without
            them. You may opt out of analytics cookies at any time by clearing your cookies and
            declining analytics in the cookie notice shown on your next visit.
          </p>
          <p className="mt-3">
            You can also configure your browser to block or delete cookies. Note that blocking
            essential cookies will prevent login and other core features from working.
          </p>
        </Section>

        <Section title="More Information">
          <p>
            For more about how we handle personal data, see our{" "}
            <Link href="/privacy" className="text-green-700 underline">Privacy Policy</Link>.
            Questions? Email us at{" "}
            <a href="mailto:privacy@774ng.com" className="text-green-700 underline">
              privacy@774ng.com
            </a>.
          </p>
        </Section>

        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-green-700 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-green-700 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}
