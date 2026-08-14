import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";

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
          <p className="text-sm text-slate-500">Effective Date: <strong>1 July 2026</strong> · Supplementary to our <Link href="/privacy" className="text-green-700 underline">Privacy Policy</Link></p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        <Section title="1. What Is This Document?">
          <p>This Data Policy supplements our Privacy Policy with specific details about how LGA data, allocation figures, project data, and citizen feedback are collected, stored, processed, and made available on the 774ng.com platform. It is intended for LGA administrators, researchers, civil society organisations, and developers who interact with platform data.</p>
        </Section>

        <Section title="2. LGA Data">
          <p>LGA profile data (LGA name, state, chairman name, office address, description, endowments, and project listings) is provided directly by verified LGA administrators. The Platform:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Displays this data publicly to facilitate transparency and investment.</li>
            <li>Does not independently verify the accuracy of endowment values, project budgets, or completion claims.</li>
            <li>Reserves the right to remove data that is flagged as inaccurate by citizens or found to violate our Terms of Service.</li>
          </ul>
        </Section>

        <Section title="3. Federal Allocation Data">
          <p>Federal allocation figures displayed on the Platform are derived from publicly available government sources and gazette publications. We do not receive official data feeds from the Federation Account Allocation Committee (FAAC). Users should cross-reference allocation data with official FAAC publications. Allocation data is updated periodically and may not reflect the most current disbursements.</p>
        </Section>

        <Section title="4. Citizen and Feedback Data">
          <p>Feedback, issue reports, and reactions submitted by citizens are associated with the submitting account. The following visibility rules apply:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li><strong>LGA administrators</strong> can see the citizen&apos;s name, LGA, and feedback text. They cannot see the citizen&apos;s email or phone number.</li>
            <li><strong>Other citizens</strong> cannot see who submitted specific feedback items.</li>
            <li><strong>Aggregated, anonymised feedback</strong> (e.g. average rating for an LGA) is publicly visible.</li>
          </ul>
        </Section>

        <Section title="5. Data Exports">
          <p>LGA administrators and platform admins may export data in XLSX format for their own governance records. Exported files:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Contain only data the exporter is authorised to access.</li>
            <li>Must not be shared publicly or used for commercial purposes without prior written consent from the Platform.</li>
            <li>Are watermarked with the Platform name, export date, and scope for audit trail purposes.</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          <p>See our <Link href="/privacy#7" className="text-green-700 underline">Privacy Policy §7</Link> for full retention schedules. In summary:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Active account data: retained indefinitely while the account is active.</li>
            <li>Deleted account data: purged within 30 days of deletion request.</li>
            <li>Payment records: retained 7 years (Nigerian financial regulation).</li>
            <li>Server/access logs: 90 days.</li>
          </ul>
        </Section>

        <Section title="7. Open Data Commitment">
          <p>We are committed to open governance data. Aggregate, non-personal platform statistics (total LGAs, total projects, total endowments, etc.) are freely available through our public API and are updated regularly. We do not charge for access to aggregate open data.</p>
        </Section>

        <Section title="8. API Access">
          <p>Public API endpoints (documented at <Link href="/docs/api" className="text-green-700 underline">/docs/api</Link>) allow programmatic access to non-personal platform data. Authenticated API access for LGA administrators and developers requires an API key, which is available from the LGA dashboard settings. Automated scraping of the Platform without a valid API key is prohibited.</p>
        </Section>

        <Section title="9. Contact">
          <p>For data-specific queries, right-to-access requests, or erasure requests: <a href="mailto:privacy@774ng.com" className="text-green-700 underline">privacy@774ng.com</a></p>
        </Section>

        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy Policy</Link>
          <Link href="/terms"   className="hover:text-green-700 transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-green-700 transition-colors">Cookie Policy</Link>
          <Link href="/"        className="hover:text-green-700 transition-colors">Back to Home</Link>
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
