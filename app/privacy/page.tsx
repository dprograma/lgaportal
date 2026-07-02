import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy Policy – 774ng.com LGA Portal" };

const EFFECTIVE_DATE = "1 July 2026";
const CONTACT_EMAIL  = "privacy@774ng.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
              <ShieldCheck className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-sm text-slate-500">
            Effective Date: <strong>{EFFECTIVE_DATE}</strong> · Compliant with the Nigeria Data
            Protection Regulation (NDPR) and the Nigeria Data Protection Act 2023 (NDPA)
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        <Section title="1. Introduction">
          <p>
            774ng.com LGA Citizen Portal (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed
            to protecting your personal data. This Privacy Policy explains what information we
            collect, why we collect it, how it is used, who it may be shared with, and the rights
            you have over your data.
          </p>
          <p className="mt-3">
            This Policy applies to all users of the Platform — citizens, LGA administrators, and
            investors. By registering or using the Platform, you consent to the practices described
            here.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p className="mb-3">We collect the following categories of personal data:</p>

          <div className="space-y-4">
            <DataBlock heading="a) Account Registration Data">
              Full name, email address, phone number, state and LGA of residence, and account type
              (citizen / LGA administrator / investor). For LGA administrators, we may also collect
              official designation and LGA affiliation documents.
            </DataBlock>

            <DataBlock heading="b) Profile and Content Data">
              Information you choose to add to your profile; content you publish (feedback,
              project comments, issue reports, press releases, endowment listings).
            </DataBlock>

            <DataBlock heading="c) Transaction and Interaction Data">
              Subscription payment records (amounts, dates, payment references — we do not store
              card details); investor inquiry records; engagement logs (reactions, comments on
              projects); issue and flag reports submitted.
            </DataBlock>

            <DataBlock heading="d) Technical Data">
              IP address, browser type, operating system, referring URLs, pages visited, session
              duration. Collected automatically via server logs and cookies.
            </DataBlock>

            <DataBlock heading="e) Communications">
              Emails or messages you send to our support team.
            </DataBlock>
          </div>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>We process your personal data for the following purposes:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>
              <strong>Account creation and authentication</strong> — verifying your identity via
              One-Time Passcode (OTP) email verification.
            </li>
            <li>
              <strong>Platform services</strong> — enabling you to use the features appropriate
              to your account type (citizen tracking, LGA management, investor inquiries).
            </li>
            <li>
              <strong>Communication</strong> — sending OTPs, service notifications, and policy
              updates to your registered email.
            </li>
            <li>
              <strong>Safety and moderation</strong> — reviewing flagged content, investigating
              reported issues, enforcing our Terms of Service.
            </li>
            <li>
              <strong>Platform improvement</strong> — aggregated, anonymised analytics to
              understand how users interact with the Platform and improve it.
            </li>
            <li>
              <strong>Legal compliance</strong> — meeting our obligations under Nigerian law,
              including the NDPA 2023 and applicable financial regulations.
            </li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <p>We process your data on the following lawful bases under the NDPA 2023:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>
              <strong>Consent</strong> — you have given clear consent at registration. You may
              withdraw consent at any time by deleting your account.
            </li>
            <li>
              <strong>Contract performance</strong> — processing necessary to provide the
              services you requested (e.g., processing subscription payments).
            </li>
            <li>
              <strong>Legitimate interests</strong> — platform security, fraud prevention, and
              service improvement, where these are not overridden by your rights.
            </li>
            <li>
              <strong>Legal obligation</strong> — where required by applicable Nigerian law.
            </li>
          </ul>
        </Section>

        <Section title="5. Cookies and Tracking">
          <p>We use the following types of cookies:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>
              <strong>Essential cookies</strong> — required for authentication (admin session
              cookie) and core Platform functionality. These cannot be disabled.
            </li>
            <li>
              <strong>Analytics cookies</strong> — anonymised usage analytics to understand
              how the Platform is used. You may opt out via our cookie preferences panel.
            </li>
          </ul>
          <p className="mt-3">
            We do not use advertising cookies or share your data with ad networks.
          </p>
          <p className="mt-3">
            For full details, see our{" "}
            <Link href="/cookies" className="text-green-700 underline">Cookie Policy</Link>.
          </p>
        </Section>

        <Section title="6. Sharing Your Data">
          <p>We do not sell your personal data. We may share it with:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>
              <strong>Service providers</strong> — hosting providers, email delivery services,
              and payment processors, under strict data processing agreements.
            </li>
            <li>
              <strong>LGA administrators</strong> — your name and LGA/state (but not your email
              or phone) may be visible to LGA administrators when you submit feedback or reports
              about their LGA.
            </li>
            <li>
              <strong>Law enforcement</strong> — when required by a valid Nigerian court order,
              legal process, or to prevent imminent harm.
            </li>
          </ul>
          <p className="mt-3">
            We require all third parties to respect the security of your data and to treat it in
            accordance with applicable Nigerian data protection law.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Active accounts</strong>: data is retained for the lifetime of your account.
            </li>
            <li>
              <strong>Deleted accounts</strong>: account data is deleted within 30 days of your
              deletion request. Aggregated, anonymised analytics data (which cannot identify you)
              may be retained indefinitely.
            </li>
            <li>
              <strong>Payment records</strong>: retained for 7 years as required by Nigerian
              financial regulations.
            </li>
            <li>
              <strong>Server logs</strong>: retained for 90 days for security and debugging
              purposes.
            </li>
          </ul>
        </Section>

        <Section title="8. Your Rights Under the NDPA 2023">
          <p>As a data subject under the Nigeria Data Protection Act 2023, you have the right to:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification</strong> — request correction of inaccurate or incomplete data.</li>
            <li><strong>Erasure</strong> — request deletion of your personal data ("right to be forgotten"), subject to legal retention requirements.</li>
            <li><strong>Restriction</strong> — request that we restrict processing of your data in certain circumstances.</li>
            <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
            <li><strong>Data portability</strong> — receive a copy of your data in a structured, machine-readable format.</li>
            <li><strong>Withdraw consent</strong> — at any time, without affecting the lawfulness of prior processing.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 underline">{CONTACT_EMAIL}</a>.
            We will respond within 30 days as required by the NDPA 2023.
          </p>
          <p className="mt-3">
            You also have the right to lodge a complaint with the Nigeria Data Protection Commission
            (NDPC) at <span className="font-medium">ndpc.gov.ng</span> if you believe your data
            rights have been violated.
          </p>
        </Section>

        <Section title="9. Data Security">
          <p>
            We implement appropriate technical and organisational measures to protect your personal
            data, including:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>HTTPS encryption in transit for all data exchanged with the Platform.</li>
            <li>Bcrypt hashing for all stored passwords.</li>
            <li>OTP-based (one-time passcode) two-factor authentication for login.</li>
            <li>Database access restricted to authorised server-side processes only.</li>
            <li>Regular security reviews of API endpoints and authentication flows.</li>
          </ul>
          <p className="mt-3">
            No method of transmission over the internet is 100% secure. If you suspect a
            data breach, contact us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="10. Children's Privacy">
          <p>
            The Platform is not intended for persons under 18 years of age. We do not knowingly
            collect personal data from minors. If you believe a minor has registered without
            parental consent, please contact us and we will delete the account promptly.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our
            practices or applicable law. We will notify registered users by email and/or an
            in-platform notice at least 14 days before material changes take effect.
          </p>
        </Section>

        <Section title="12. Contact and Data Controller">
          <p>
            The data controller for this Platform is 774ng.com LGA Citizen Portal. For any
            privacy-related queries, requests, or complaints:
          </p>
          <div className="mt-3 p-4 bg-slate-100 rounded-xl text-sm text-slate-600 space-y-1">
            <p><strong>Email:</strong>{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 underline">{CONTACT_EMAIL}</a>
            </p>
            <p><strong>Platform:</strong> 774ng.com</p>
            <p><strong>Jurisdiction:</strong> Federal Republic of Nigeria</p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
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

function DataBlock({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="pl-4 border-l-2 border-green-200">
      <p className="font-semibold text-slate-800 mb-1">{heading}</p>
      <p className="text-slate-600">{children}</p>
    </div>
  );
}
