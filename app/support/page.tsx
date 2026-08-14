import Link from "next/link";
import { Mail, Phone, MessageSquare, FileText, HelpCircle, Building2, ArrowRight } from "lucide-react";

export const metadata = { title: "Support – 774ng.com LGA Portal" };

const channels = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "Send us a message and we'll respond within 24 business hours.",
    action: "support@774ng.com",
    href: "mailto:support@774ng.com",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Phone,
    title: "Phone / WhatsApp",
    desc: "Speak directly with our support team. Available Mon–Fri, 8am–6pm WAT.",
    action: "+234 800 LGA PORT",
    href: "tel:+2348005427678",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Chat",
    desc: "Send a WhatsApp message for quick responses.",
    action: "Chat on WhatsApp",
    href: "https://wa.me/2349000000000",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const resources = [
  { icon: HelpCircle, title: "FAQs",              desc: "Answers to the most common questions.",       href: "/faqs"        },
  { icon: FileText,   title: "How It Works",       desc: "Step-by-step guide to using the platform.",  href: "/how-it-works" },
  { icon: Building2,  title: "LGA Verification Guide", desc: "What LGAs need to get verified.",        href: "/lga-verify"  },
  { icon: FileText,   title: "Terms of Service",   desc: "Your rights and responsibilities.",           href: "/terms"       },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">How Can We Help?</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Our support team is here to help citizens, LGA administrators, and investors get the most out of the platform.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* Contact channels */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-6">Contact Us</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {channels.map(({ icon: Icon, title, desc, action, href, color }) => (
              <a
                key={title}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 mb-3 leading-relaxed">{desc}</p>
                <span className="text-sm font-semibold text-green-700 group-hover:underline">{action}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Self-service resources */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-6">Self-Service Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {resources.map(({ icon: Icon, title, desc, href }) => (
              <Link
                key={title}
                href={href}
                className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 hover:border-green-300 hover:shadow-sm transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-green-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-green-600 shrink-0 mt-1 ml-auto" />
              </Link>
            ))}
          </div>
        </section>

        {/* Report issue */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-amber-700" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-slate-900 mb-1">Report a Platform Issue or Bad Content</h3>
            <p className="text-sm text-slate-500">See something wrong on the platform? Submit a report and we&apos;ll review it promptly.</p>
          </div>
          <Link href="/report" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all whitespace-nowrap">
            Report an Issue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
