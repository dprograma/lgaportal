"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, BadgeCheck, Building2, TrendingUp, FolderOpen,
  Wheat, Gem, Beef, Fish, TreePine, Zap, Factory,
  ArrowLeft, ArrowRight, Mail, Phone, User,
  type LucideIcon,
} from "lucide-react";

/* ─── Category meta ──────────────────────────────────────────────────────── */
const CATEGORY_META: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  AGRICULTURE:   { label: "Agriculture",    icon: Wheat,    color: "text-lime-600"    },
  MINERALS:      { label: "Solid Minerals", icon: Gem,      color: "text-cyan-600"    },
  LIVESTOCK:     { label: "Livestock",      icon: Beef,     color: "text-amber-600"   },
  FISHERIES:     { label: "Fisheries",      icon: Fish,     color: "text-blue-600"    },
  FORESTRY:      { label: "Forestry",       icon: TreePine, color: "text-emerald-600" },
  ENERGY:        { label: "Energy",         icon: Zap,      color: "text-yellow-600"  },
  TOURISM:       { label: "Tourism",        icon: MapPin,   color: "text-rose-600"    },
  MANUFACTURING: { label: "Manufacturing",  icon: Factory,  color: "text-slate-600"   },
};

/* ─── Mock LGA data (replace with real DB fetch in production) ───────────── */
const MOCK_LGA = {
  lgaName:     "Udi",
  state:       "Enugu",
  chairmanName: "Hon. Chukwuemeka Eze",
  description: "Udi LGA is located in Enugu State, southeast Nigeria. It is endowed with significant mineral and agricultural resources and is one of the most industrially promising LGAs in the region.",
  population:  "350,000",
  isVerified:  true,
  sectors:     ["Mining", "Agriculture", "Education"],
};

const MOCK_ENDOWMENTS = [
  {
    id: "1",
    category: "MINERALS",
    title: "Coal & Limestone Deposits",
    description: "Udi hosts some of the richest coal and limestone deposits in southeast Nigeria. The coal seams are commercially viable and the limestone is high-grade, suitable for cement and building materials production.",
    highlights: [
      "Extensive coal deposits — commercially viable seams",
      "High-grade limestone for cement production",
      "Proximity to Enugu–Port Harcourt rail line",
      "State mining investment promotion board active",
    ],
    investmentRange: "₦500M – ₦10B+",
    contactPerson: "Investment Desk",
    contactEmail: "invest@udi.gov.ng",
    isPublished: true,
  },
  {
    id: "2",
    category: "AGRICULTURE",
    title: "Rice, Cassava & Yam Belt",
    description: "Fertile land across Udi supports year-round cultivation of rice, cassava, yam and palm produce. The LGA is part of the Enugu State Agricultural Development Programme zone.",
    highlights: [
      "Fertile loamy soil — multiple harvests per year",
      "Rice & cassava as primary cash crops",
      "State ADP support and input subsidies available",
      "Farm-to-market road network under development",
    ],
    investmentRange: "₦100M – ₦3B",
    contactPerson: "Agricultural Officer",
    contactEmail: "agric@udi.gov.ng",
    isPublished: true,
  },
];

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
type Tab = "overview" | "endowments" | "projects";

/* ─── Inquiry modal ──────────────────────────────────────────────────────── */
function InquiryModal({
  endowmentTitle,
  lgaName,
  onClose,
}: {
  endowmentTitle: string;
  lgaName: string;
  onClose: () => void;
}) {
  const [step, setStep]         = useState<"form" | "success">("form");
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    // In production, POST to /api/investors/inquiries
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep("success");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400 rounded-t-2xl" />

        {step === "success" ? (
          <div className="p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Inquiry Sent</h3>
            <p className="text-sm text-slate-500 mb-6">
              Your investment inquiry about <strong>{lgaName} LGA</strong> has been
              forwarded to their investment desk. Expect a response within 2–5 business days.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Express Investment Interest</h3>
                <p className="text-xs text-slate-400 mt-0.5">{endowmentTitle} · {lgaName} LGA</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <User className="h-3 w-3 inline mr-1" />Your Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name or company"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <Mail className="h-3 w-3 inline mr-1" />Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Briefly describe your investment interest, capacity, and any questions you have for this LGA..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                  {loading ? "Sending…" : <><ArrowRight className="h-4 w-4" />Send Inquiry</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function LGAProfilePage() {
  const params            = useParams<{ slug: string }>();
  const [tab, setTab]     = useState<Tab>("endowments");
  const [inquiry, setInquiry] = useState<{ title: string } | null>(null);

  // In production: fetch LGA by slug from DB
  const lga = MOCK_LGA;
  const endowments = MOCK_ENDOWMENTS;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header banner */}
      <div className="bg-[#071a0e] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#008751]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#008751]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-10">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-1.5 text-green-300 text-xs mb-6 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to LGAs
          </Link>

          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-2xl bg-green-600/20 border border-green-500/30 flex items-center justify-center shrink-0">
              <Building2 className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{lga.lgaName} LGA</h1>
                {lga.isVerified && (
                  <BadgeCheck className="h-5 w-5 text-green-400" title="Verified LGA" />
                )}
              </div>
              <p className="text-sm text-green-200/60 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {lga.state} State, Nigeria
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {lga.sectors.map((s) => (
                  <span key={s} className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px] font-medium border border-white/10">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-0">
          {(["overview", "endowments", "projects"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "endowments" ? "Investment & Endowments" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Overview tab ──────────────────────────────────────────── */}
        {tab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
              <div className="p-6">
                <h2 className="text-base font-bold text-slate-900 mb-3">About {lga.lgaName} LGA</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{lga.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: User,      label: "Chairman",   value: lga.chairmanName },
                { icon: MapPin,    label: "State",      value: lga.state        },
                { icon: Building2, label: "Population", value: lga.population   },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Endowments tab ────────────────────────────────────────── */}
        {tab === "endowments" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section intro */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-bold text-slate-900">Investment & Natural Endowments</h2>
              </div>
              <p className="text-sm text-slate-500">
                Natural resources and investment opportunities available in {lga.lgaName} LGA.
                Click &ldquo;Express Interest&rdquo; to send a direct inquiry to this LGA&apos;s investment desk.
              </p>
            </div>

            {endowments.length === 0 ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
                <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No investment listings published yet for this LGA.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {endowments.map((e) => {
                  const meta = CATEGORY_META[e.category] ?? CATEGORY_META.AGRICULTURE;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={e.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-md transition-all"
                    >
                      <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0`}>
                            <Icon className={`h-5 w-5 ${meta.color}`} />
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${meta.color}`}>
                              {meta.label}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{e.title}</h3>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          {e.description}
                        </p>

                        {/* Highlights */}
                        <ul className="space-y-1.5 mb-4">
                          {e.highlights.map((h) => (
                            <li key={h} className="flex items-start gap-2 text-xs text-slate-600">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>

                        {/* Footer */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            {e.investmentRange && (
                              <p className="text-xs font-bold text-green-700">{e.investmentRange}</p>
                            )}
                            {e.contactPerson && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />{e.contactPerson}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setInquiry({ title: e.title })}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold transition-colors"
                          >
                            Express Interest <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* General inquiry CTA */}
            <div className="mt-8 bg-[#071a0e] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Don&apos;t see what you&apos;re looking for?
                </h3>
                <p className="text-sm text-green-200/60">
                  Send a general investment inquiry directly to {lga.lgaName} LGA.
                </p>
              </div>
              <button
                onClick={() => setInquiry({ title: `General Investment Inquiry` })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 text-sm font-semibold transition-all shrink-0"
              >
                <Mail className="h-4 w-4" /> Contact Investment Desk
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Projects tab ──────────────────────────────────────────── */}
        {tab === "projects" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center"
          >
            <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Projects for {lga.lgaName} LGA coming soon.</p>
            <Link href="/#projects" className="text-xs text-green-700 font-medium hover:underline mt-2 inline-block">
              Browse all projects →
            </Link>
          </motion.div>
        )}
      </div>

      {/* Inquiry modal */}
      {inquiry && (
        <InquiryModal
          endowmentTitle={inquiry.title}
          lgaName={lga.lgaName}
          onClose={() => setInquiry(null)}
        />
      )}
    </div>
  );
}
