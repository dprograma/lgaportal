import Link from "next/link";
import { Database, ArrowLeft } from "lucide-react";

export const metadata = { title: "Data Policy – 774ng.com LGA Portal" };

export default function DataPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Data Policy</h1>
          </div>
          <p className="text-sm text-slate-500">Effective Date: <strong>1 July 2026</strong> · Applies to all Platform users</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        <p className="text-sm text-slate-600 leading-relaxed bg-green-50 border border-green-200 rounded-xl p-5">
          This Data Policy explains specifically how 774ng.com collects, processes, stores, and
          protects data on the Platform. For the full statement of your rights as a data subject
          under the Nigeria Data Protection Act 2023, see our{" "}
          <Link href="/privacy" className="text-green-700 underline">Privacy Policy</Link>.
        </p>

        <Section title="1. Data We Store">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>User accounts:</strong> name, email, hashed password (bcrypt), phone, state/LGA of residence.</li>
            <li><strong>LGA profiles:</strong> LGA name, state, chairman details, office address, population, description, logo.</li>
            <li><strong>Projects:</strong> title, description, category, budget, status, timeline, published documents.</li>
            <li><strong>Endowments:</strong> resource category, title, description, highlights, investment range.</li>
            <li><strong>Allocations:</strong> federal allocation amounts, periods, breakdowns (sourced from official extracts).</li>
            <li><strong>Feedback & reports:</strong> message text, rating, category, timestamp — linked to user account.</li>
            <li><strong>Investor inquiries:</strong> message text, sector, contact info — linked to investor account and LGA.</li>
            <li><strong>Press releases:</strong> title, body, issuing entity, attachment URL, approval status.</li>
            <li><strong>Server logs:</strong> IP address, user-agent, request path, timestamp — retained for 90 days.</li>
          </ul>
        </Section>

        <Section title="2. How Data Flows">
          <ul className="list-disc pl-5 space-y-2">
            <li>All data is transmitted over HTTPS (TLS 1.2+). No data is sent in plain HTTP.</li>
            <li>Passwords are never stored in plain text. Only a bcrypt hash is stored.</li>
            <li>LGA identifiers are stored in the browser&apos;s <code className="text-xs bg-slate-100 px-1 rounded">sessionStorage</code> after successful OTP verification — not in cookies — and cleared when the browser tab is closed.</li>
            <li>Admin sessions use an <code className="text-xs bg-slate-100 px-1 rounded">HttpOnly</code>, <code className="text-xs bg-slate-100 px-1 rounded">Secure</code> cookie that cannot be accessed by JavaScript.</li>
            <li>Payment transactions are processed by Paystack. We store only the transaction reference and amount — never card details.</li>
          </ul>
        </Section>

        <Section title="3. Data Retention">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-200">Data Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-200">Retention Period</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {[
                  ["Active account data", "Duration of account"],
                  ["Deleted account data", "30 days after deletion request"],
                  ["Payment records", "7 years (financial regulation)"],
                  ["Server access logs", "90 days"],
                  ["Analytics (anonymised)", "Indefinitely (cannot identify you)"],
                  ["OTP codes", "10 minutes from issue"],
                  ["Investor inquiry records", "3 years after submission"],
                ].map(([type, period]) => (
                  <tr key={type} className="even:bg-slate-50">
                    <td className="px-3 py-2 border border-slate-200">{type}</td>
                    <td className="px-3 py-2 border border-slate-200">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. Third-Party Data Processors">
          <p>We share data with the following processors, each bound by data processing agreements:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li><strong>Hosting provider:</strong> server infrastructure and database hosting.</li>
            <li><strong>Email delivery:</strong> OTP and transactional emails are sent via an authorised email service provider.</li>
            <li><strong>Paystack:</strong> payment processing for LGA subscriptions.</li>
          </ul>
          <p className="mt-3">We do not share data with advertising networks, data brokers, or social media platforms.</p>
        </Section>

        <Section title="5. Data Security Measures">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>HTTPS enforced on all routes; HTTP requests are redirected.</li>
            <li>Database access is restricted to application server processes only — no direct public access.</li>
            <li>Admin authentication uses a combination of a secret cookie and server-side session validation.</li>
            <li>LGA authentication uses time-limited OTPs (10-minute expiry) delivered to registered emails.</li>
            <li>All file uploads are stored in a private bucket; access requires a signed URL.</li>
            <li>Security reviews of API endpoints are conducted periodically.</li>
          </ul>
        </Section>

        <Section title="6. Your Data Rights">
          <p>Under the Nigeria Data Protection Act 2023, you may request access to, correction of, or deletion of your data at any time. Contact our Data Officer at{" "}
            <a href="mailto:privacy@774ng.com" className="text-green-700 underline">privacy@774ng.com</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="7. Questions">
          <p>For technical data questions not covered here, email <a href="mailto:privacy@774ng.com" className="text-green-700 underline">privacy@774ng.com</a>. For platform support, email <a href="mailto:support@774ng.com" className="text-green-700 underline">support@774ng.com</a>.</p>
        </Section>

        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-green-700 transition-colors">Cookie Policy</Link>
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
