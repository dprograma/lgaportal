import Link from "next/link";
import { db } from "@/lib/db";
import { CheckCircle, ChevronDown } from "lucide-react";

function formatNaira(kobo: bigint | number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(kobo) / 100
  );
}

const faqs = [
  {
    q: "How do I get started?",
    a: "Choose a plan below, create your campaign, and complete payment via Paystack. Your campaign goes live after admin review.",
  },
  {
    q: "How long does review take?",
    a: "Campaigns are typically reviewed within 24-48 business hours.",
  },
  {
    q: "What ad formats are supported?",
    a: "We support banners, sidebars, sponsored content listings, and featured placements across the LGA Portal.",
  },
  {
    q: "Can I pause my campaign?",
    a: "Yes, you can pause and resume active campaigns from your advertiser dashboard at any time.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept card payments, bank transfers, and USSD via Paystack.",
  },
];

export default async function AdvertisePage() {
  const plans = await db.adPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-green-600 text-white px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Reach 50M+ Nigerians
          </h1>
          <p className="text-green-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Advertise on LGA Portal and connect your brand with local government audiences,
            investors, and citizens across all 774 LGAs in Nigeria.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#plans"
              className="bg-white text-green-800 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors"
            >
              View Plans
            </a>
            <Link
              href="/login"
              className="border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Already an advertiser? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-50 border-b border-green-100 px-4 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Monthly Visitors", value: "50M+" },
            { label: "LGAs Covered", value: "774" },
            { label: "States", value: "36" },
            { label: "Daily Active Users", value: "2M+" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-bold text-green-700">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="px-4 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-2">
          Advertising Plans
        </h2>
        <p className="text-slate-500 text-center mb-10">
          Choose the plan that fits your campaign goals and budget.
        </p>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No plans available at the moment. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border border-slate-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-green-700">
                    {formatNaira(plan.price)}
                  </span>
                  <span className="text-slate-400 text-sm ml-1">
                    / {plan.durationDays} days
                  </span>
                </div>

                <div className="space-y-3 flex-1 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Formats
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.formats.map((f) => (
                        <span
                          key={f}
                          className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full border border-green-200"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Placements
                    </p>
                    <ul className="space-y-1">
                      {plan.placements.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {p.replace(/_/g, " ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {plan.maxImpressions && (
                    <p className="text-sm text-slate-500">
                      Up to{" "}
                      <strong>{plan.maxImpressions.toLocaleString()}</strong> impressions
                    </p>
                  )}
                </div>

                <Link
                  href={`/advertiser/campaigns/new?planId=${plan.id}`}
                  className="block w-full text-center bg-green-700 text-white font-semibold py-2.5 rounded-xl hover:bg-green-800 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-white border border-slate-200 rounded-xl group"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-slate-800 list-none">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="px-5 pb-4 text-slate-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-700 text-white px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to grow your reach?</h2>
        <p className="text-green-200 mb-6">
          Join businesses already advertising on Nigeria&apos;s LGA Portal.
        </p>
        <Link
          href="/login?callbackUrl=/advertiser"
          className="bg-white text-green-800 font-semibold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors inline-block"
        >
          Start Advertising Today
        </Link>
      </section>
    </div>
  );
}
