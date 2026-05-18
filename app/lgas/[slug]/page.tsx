"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, BadgeCheck, Building2, TrendingUp, FolderOpen,
  Wheat, Gem, Beef, Fish, TreePine, Zap, Factory,
  ArrowLeft, ArrowRight, Mail, Phone, User, Users,
  UserCircle2, Hash,
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

/* ─── LGA data types ─────────────────────────────────────────────────────── */
interface LGAData {
  id: string; lgaName: string; state: string; chairmanName: string;
  description: string | null; population: string | null;
  isVerified: boolean; sectors: string[];
  wards: WardData[]; endowments: EndowmentData[];
}
interface WardData {
  id: string; wardNumber: number | null; wardName: string;
  councillorName: string; councillorPhone: string | null;
  councillorEmail: string | null; councillorImage: string | null;
  description: string | null; population: string | null; isActive: boolean;
}
interface EndowmentData {
  id: string; category: string; title: string; description: string;
  highlights: string[]; investmentRange: string | null;
  contactPerson: string | null; contactEmail: string | null; isPublished: boolean;
}

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
type Tab = "overview" | "wards" | "endowments" | "projects";

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
  const params    = useParams<{ slug: string }>();
  const [tab, setTab]         = useState<Tab>("wards");
  const [inquiry, setInquiry] = useState<{ title: string } | null>(null);
  const [lga, setLga]         = useState<LGAData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/lgas/by-slug?slug=${params.slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setNotFound(true);
        else setLga(json.lga);
      })
      .catch(() => setNotFound(true));
  }, [params.slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-700 mb-2">LGA Not Found</p>
          <p className="text-slate-400 text-sm mb-6">No LGA matched &ldquo;{params.slug}&rdquo;.</p>
          <Link href="/" className="text-green-700 font-semibold hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!lga) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-xl mx-auto" />
          <div className="h-4 w-32 bg-slate-100 animate-pulse rounded mx-auto" />
        </div>
      </div>
    );
  }

  const wards      = lga.wards;
  const endowments = lga.endowments;

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
                  <BadgeCheck className="h-5 w-5 text-green-400" />
                )}
              </div>
              <p className="text-sm text-green-200/60 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {lga.state} State, Nigeria
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(lga.sectors ?? []).map((s) => (
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
          {([
            { id: "wards",      label: "Wards & Councillors"    },
            { id: "overview",   label: "Overview"               },
            { id: "endowments", label: "Investment & Endowments"},
            { id: "projects",   label: "Projects"               },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Wards & Councillors tab ───────────────────────────────── */}
        {tab === "wards" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-bold text-slate-900">Wards & Councillors</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              {lga.lgaName} LGA is divided into {wards.length} wards, each represented by an
              elected councillor on the LGA legislative council.
            </p>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Wards",   value: wards.length },
                { label: "Active Wards",  value: wards.filter((w) => w.isActive).length },
                { label: "Est. Population", value: wards.reduce((acc, w) => acc + (parseInt((w.population ?? "0").replace(/,/g, ""), 10) || 0), 0).toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-green-700">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {wards.length === 0 ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
                <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No ward information published yet for this LGA.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wards.map((ward) => (
                  <div
                    key={ward.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                      ward.isActive
                        ? "border-slate-200 hover:border-green-300 hover:shadow-md"
                        : "border-slate-100 opacity-60"
                    }`}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                    <div className="p-4">
                      {/* Ward label */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          {ward.wardNumber && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md">
                              <Hash className="h-2.5 w-2.5" />{ward.wardNumber}
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-slate-900">{ward.wardName}</h3>
                        </div>
                        {!ward.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Councillor card */}
                      <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl mb-3">
                        {ward.councillorImage ? (
                          <img
                            src={ward.councillorImage}
                            alt={ward.councillorName}
                            className="h-10 w-10 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                            <UserCircle2 className="h-6 w-6 text-green-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{ward.councillorName}</p>
                          <p className="text-[10px] text-green-700 font-medium">Ward Councillor</p>
                        </div>
                      </div>

                      {/* Description */}
                      {ward.description && (
                        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                          {ward.description}
                        </p>
                      )}

                      {/* Population */}
                      {ward.population && (
                        <p className="text-[10px] text-slate-400 mb-3">
                          Population: <span className="font-semibold text-slate-600">{ward.population}</span>
                        </p>
                      )}

                      {/* Contact info */}
                      {(ward.councillorPhone || ward.councillorEmail) && (
                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                          {ward.councillorPhone && (
                            <a
                              href={`tel:${ward.councillorPhone}`}
                              className="flex items-center gap-2 text-xs text-slate-500 hover:text-green-700 transition-colors"
                            >
                              <Phone className="h-3 w-3 shrink-0" />{ward.councillorPhone}
                            </a>
                          )}
                          {ward.councillorEmail && (
                            <a
                              href={`mailto:${ward.councillorEmail}`}
                              className="flex items-center gap-2 text-xs text-slate-500 hover:text-green-700 transition-colors truncate"
                            >
                              <Mail className="h-3 w-3 shrink-0" />{ward.councillorEmail}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

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
                { icon: User,      label: "Chairman",   value: lga.chairmanName ?? "Vacant" },
                { icon: MapPin,    label: "State",      value: lga.state },
                { icon: Building2, label: "Population", value: lga.population ?? "N/A" },
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
