import Link from "next/link";
import { Database, ArrowLeft } from "lucide-react";

export const metadata = { title: "Data Policy – 774ng.com" };

export default function DataPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Data Policy</h1>
          </div>
          <p className="text-sm text-slate-500">
            Effective Date: <strong>1 July 2026</strong> · Governs all data published on 774ng.com by LGAs, citizens, and platform administrators
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        <Section title="1. Purpose of This Policy">
          <p>
            This Data Policy explains the standards we apply to data published on the 774ng.com
            platform — including LGA profiles, project records, allocation data, endowment
            listings, and press releases. It is separate from our{" "}
            <Link href="/privacy" className="text-green-700 underline">Privacy Policy</Link>,
            which governs personal data about individual users.
          </p>
        </Section>

        <Section title="2. LGA-Submitted Data">
          <p>
            LGA administrators who publish data on the platform represent that:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>All submitted figures (project budgets, allocation amounts, ward populations) are accurate to the best of their knowledge.</li>
            <li>Documents uploaded (contracts, audit reports, budget sheets) are genuine and unaltered.</li>
            <li>Press releases reflect factual events and are not intentionally misleading.</li>
          </ul>
          <p className="mt-3">
            We reserve the right to flag, unpublish, or remove any data that is reported by
            citizens or identified by our moderation team as inaccurate or fraudulent.
          </p>
        </Section>

        <Section title="3. Allocation Data">
          <p>
            Federal allocation records displayed on the platform are sourced from publicly
            available government disbursement records and citizen-submitted data. While we
            strive for accuracy, we do not guarantee that these figures match official FAAC
            records in real time. Users are encouraged to cross-reference with the Revenue
            Mobilisation Allocation and Fiscal Commission (RMAFC) for authoritative figures.
          </p>
        </Section>

        <Section title="4. Open Data Principles">
          <p>
            Aggregate and anonymised platform data — such as total projects per state, average
            project completion rates, and LGA activity rankings — may be made available as
            open data for research, journalism, and civic purposes. This data will never include
            personally identifiable information.
          </p>
          <p className="mt-3">
            To request a data export for research or civic use, contact us at{" "}
            <a href="mailto:data@774ng.com" className="text-green-700 underline">data@774ng.com</a>.
          </p>
        </Section>

        <Section title="5. Data Corrections">
          <p>
            If you believe any published LGA data is incorrect, you may:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Use the flag/report button on any project or profile page.</li>
            <li>Submit a correction request via our <Link href="/contact" className="text-green-700 underline">Contact page</Link> with subject &ldquo;Data Correction Request.&rdquo;</li>
          </ul>
          <p className="mt-3">
            We will investigate and, where warranted, update or remove the data within 10 business days.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            Published LGA data (projects, press releases, endowments) is retained for the
            lifetime of the LGA&apos;s account. If an LGA account is closed, their public data
            is archived (not deleted) for a minimum of 2 years to preserve the public record
            of government activity. After 2 years, archived data may be deleted upon the
            former LGA administrator&apos;s written request.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            Data policy questions:{" "}
            <a href="mailto:data@774ng.com" className="text-green-700 underline font-medium">data@774ng.com</a>
          </p>
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
