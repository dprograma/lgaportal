import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export const metadata = { title: "Terms of Service – 774ng.com LGA Portal" };

const EFFECTIVE_DATE = "1 July 2026";
const PLATFORM_NAME  = "774ng.com LGA Citizen Portal";
const CONTACT_EMAIL  = "support@774ng.com";

export default function TermsPage() {
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
              <Scale className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
          </div>
          <p className="text-sm text-slate-500">
            Effective Date: <strong>{EFFECTIVE_DATE}</strong> · Platform: <strong>{PLATFORM_NAME}</strong>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        <Section title="1. About This Platform">
          <p>
            {PLATFORM_NAME} (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is an independent
            digital governance and investment facilitation platform operating in Nigeria. It enables
            Local Government Areas (LGAs) to showcase their endowments, publish projects and
            allocations, and connect with investors and citizens. Citizens may access and track LGA
            activities. Investors may register to discover and engage with investment opportunities.
          </p>
          <p className="mt-3">
            By accessing or using the Platform, you agree to be bound by these Terms of Service
            (&ldquo;Terms&rdquo;). If you do not agree, please discontinue use immediately.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must be at least 18 years old to register an account.</li>
            <li>LGA accounts may only be created by authorised LGA chairmen or designated officials.</li>
            <li>
              You represent that all information you provide is accurate, current, and complete.
              Providing false information — including impersonating an LGA official — may result in
              immediate account suspension and possible legal action.
            </li>
          </ul>
        </Section>

        <Section title="3. User Accounts">
          <p>There are three account types on the Platform:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>
              <strong>Citizens:</strong> Free accounts for Nigerian residents to view LGA data,
              track projects, submit feedback, and report issues.
            </li>
            <li>
              <strong>LGA Administrators:</strong> Accounts for verified LGA chairmen and authorised
              staff to manage their LGA profile, publish projects, list endowments, and respond to
              citizen feedback.
            </li>
            <li>
              <strong>Investors:</strong> Accounts for individuals and entities interested in
              exploring LGA investment opportunities and submitting inquiries.
            </li>
          </ul>
          <p className="mt-3">
            You are responsible for maintaining the security of your login credentials. You must
            notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 underline">{CONTACT_EMAIL}</a> if
            you suspect unauthorised access to your account.
          </p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree <strong>not</strong> to:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Post false, misleading, or defamatory content about any LGA, individual, or organisation.</li>
            <li>Impersonate any government official, LGA chairman, or platform staff member.</li>
            <li>Use the Platform to facilitate corruption, money laundering, or any unlawful activity.</li>
            <li>Upload malicious code, attempt to hack, or disrupt Platform services.</li>
            <li>Harvest user data or scrape the Platform without prior written permission.</li>
            <li>Use the Platform to send unsolicited communications (spam) to other users.</li>
            <li>Submit fabricated project data, fake allocations, or false endowment claims.</li>
          </ul>
          <p className="mt-3">
            Violations may result in immediate account suspension, removal of content, and referral
            to relevant Nigerian law enforcement authorities.
          </p>
        </Section>

        <Section title="5. LGA Data and Content">
          <p>
            LGA administrators who publish content on the Platform — including project updates,
            allocation data, press releases, and endowment listings — represent that such
            information is accurate and authorised for publication. The Platform does not
            independently verify all data submitted by LGA administrators. Citizens and investors
            are encouraged to cross-reference official government sources.
          </p>
          <p className="mt-3">
            We reserve the right to remove or flag content that appears false, misleading, or in
            violation of these Terms, without prior notice to the LGA concerned.
          </p>
        </Section>

        <Section title="6. Investment Facilitation">
          <p>
            The Platform facilitates connections between investors and LGA administrations. It does
            not endorse, guarantee, or broker any investment transaction. Any due diligence,
            negotiation, and execution of investment agreements is strictly between the investor
            and the LGA. The Platform bears no liability for the outcome of any investment
            engagement made through the Platform.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All Platform design, branding, software, and content created by us are our intellectual
            property. Content submitted by users (posts, project descriptions, press releases, etc.)
            remains the property of the submitting party; however, by submitting content, you grant
            us a non-exclusive, royalty-free, worldwide licence to display, distribute, and promote
            that content in connection with operating the Platform.
          </p>
        </Section>

        <Section title="8. Subscriptions and Payments">
          <p>
            Certain features for LGA administrators require a paid subscription. Subscription fees
            are set out on the Platform&apos;s pricing page and are subject to change with 30 days&apos; notice.
            All payments are processed through our authorised payment providers and are
            non-refundable except where required by applicable Nigerian consumer protection law.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>
            The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We make no warranty that the Platform
            will be uninterrupted, error-free, or free of harmful components. We do not warrant the
            accuracy of any LGA data, allocation figures, or investment opportunity descriptions
            published by third parties on the Platform.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by Nigerian law, the Platform and its operators shall
            not be liable for any indirect, incidental, special, consequential, or punitive damages
            arising out of your use of, or inability to use, the Platform — including losses from
            investment decisions made based on Platform data.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with the laws of the Federal
            Republic of Nigeria. Any dispute arising from or related to these Terms shall be
            subject to the exclusive jurisdiction of the courts of the Federal Capital Territory,
            Abuja, Nigeria.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>
            We may update these Terms from time to time. Significant changes will be notified to
            registered users via email and/or an in-platform notice at least 14 days before they
            take effect. Continued use of the Platform after the effective date of updated Terms
            constitutes your acceptance of the new Terms.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>
            Questions or concerns about these Terms? Contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 underline font-medium">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy Policy</Link>
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
