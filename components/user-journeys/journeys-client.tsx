"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  User, Building2, TrendingUp, ShieldCheck,
  MailCheck, UserCircle, Settings, Search,
  MessageSquare, Hourglass, LayoutDashboard, HardHat,
  Users, Mail, Briefcase, Newspaper, CalendarClock, CreditCard,
  CheckCircle2, MapPin, Coins, ClipboardCheck, Video,
  Flag, Tag, BarChart2, Timer, ArrowRight,
  type LucideIcon,
} from "lucide-react";

type Role = "citizen" | "chairman" | "investor" | "admin";

interface Step {
  n?: number;
  route: string;
  title: string;
  desc: string;
  img?: string;
  icon?: LucideIcon;
  id?: string;
  crossLink?: { role: Role; id: string; label: string };
}

interface Group {
  label: string;
  steps: Step[];
}

interface RoleSection {
  role: Role;
  roleNum: string;
  heading: string;
  desc: string;
  groups: Group[];
}

const ROLE_META: Record<
  Role,
  {
    label: string;
    count: number;
    tabIcon: LucideIcon;
    tabActive: string;
    numBadge: string;
    chip: string;
    eyebrow: string;
    diagramBg: string;
    diagramIcon: string;
    ring: string;
  }
> = {
  citizen: {
    label: "Citizen",
    count: 10,
    tabIcon: User,
    tabActive: "bg-blue-50 border-blue-600 text-blue-800",
    numBadge: "bg-blue-700",
    chip: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
    eyebrow: "text-blue-700",
    diagramBg: "bg-blue-50",
    diagramIcon: "text-blue-700",
    ring: "ring-blue-400",
  },
  chairman: {
    label: "LGA Chairman",
    count: 15,
    tabIcon: Building2,
    tabActive: "bg-green-50 border-green-600 text-green-800",
    numBadge: "bg-green-700",
    chip: "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
    eyebrow: "text-green-700",
    diagramBg: "bg-green-50",
    diagramIcon: "text-green-700",
    ring: "ring-green-400",
  },
  investor: {
    label: "Investor",
    count: 5,
    tabIcon: TrendingUp,
    tabActive: "bg-amber-50 border-amber-500 text-amber-800",
    numBadge: "bg-amber-600",
    chip: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
    eyebrow: "text-amber-700",
    diagramBg: "bg-amber-50",
    diagramIcon: "text-amber-700",
    ring: "ring-amber-400",
  },
  admin: {
    label: "Platform Admin",
    count: 15,
    tabIcon: ShieldCheck,
    tabActive: "bg-violet-50 border-violet-600 text-violet-800",
    numBadge: "bg-violet-700",
    chip: "bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100",
    eyebrow: "text-violet-700",
    diagramBg: "bg-violet-50",
    diagramIcon: "text-violet-700",
    ring: "ring-violet-400",
  },
};

const SECTIONS: RoleSection[] = [
  // ── CITIZEN ──────────────────────────────────────────────────────────
  {
    role: "citizen",
    roleNum: "Role 01",
    heading: "From sign-up to seeing where the money went",
    desc: "Any Nigerian can register, verify their identity, and start tracking federal allocations and projects in their own LGA — no invitation required.",
    groups: [
      {
        label: "The journey, in order",
        steps: [
          { n: 1, route: "774ng.com/", title: "Discover", img: "/user-journeys/landing.jpg",
            desc: "Lands on the public homepage — live allocation stats, featured LGAs, ongoing projects — before ever creating an account." },
          { n: 2, route: "/signup", title: "Create an Account", img: "/user-journeys/citizen-signup.jpg",
            desc: "Registers with full name, email, phone, state and LGA of residence, and a password. Every account starts as a direct registration — there is no social sign-in." },
          { n: 3, route: "/verify-otp", title: "Verify Email", icon: MailCheck,
            desc: "Enters the 6-digit code emailed to them to confirm the address before the account activates." },
          { n: 4, route: "/login", title: "Sign In", img: "/user-journeys/citizen-login.jpg",
            desc: "Returns to sign in with email and password. A fresh one-time code challenges every new session before it's trusted." },
          { n: 5, route: "/profile", title: "My Profile", icon: UserCircle,
            desc: "Manages name, phone, LGA of residence, and profile photo — the same identity shown on any comment they leave." },
          { n: 6, route: "/settings", title: "Account Settings", icon: Settings,
            desc: "Changes password, signs out, or permanently deletes the account — there's no linked social login to unwind first." },
          { n: 7, route: "/lgas", title: "Explore LGAs", img: "/user-journeys/lgas-directory.jpg",
            desc: "Searches or filters all 774 Local Government Areas by state, population, or verification status." },
          { n: 8, route: "/lgas/[lga-slug]", title: "Open an LGA's Profile", img: "/user-journeys/lga-profile-overview.jpg",
            desc: "Reads the LGA's overview, ward list, posts, and project archive — the same public page an investor uses to find opportunities." },
          { n: 9, route: "inline · on posts", title: "Engage & Give Feedback", icon: MessageSquare,
            desc: "Comments on the LGA's posts and updates. Every comment is subject to review.",
            crossLink: { role: "admin", id: "tile-moderation", label: "Comments queue for Platform Admin" } },
          { n: 10, route: "/allocations", title: "Track Federal Allocations", img: "/user-journeys/allocations.jpg",
            desc: "Cross-references monthly FAAC releases against what the LGA itself reports receiving — the platform's core transparency promise." },
        ],
      },
    ],
  },

  // ── LGA CHAIRMAN ─────────────────────────────────────────────────────
  {
    role: "chairman",
    roleNum: "Role 02",
    heading: "Getting a Local Government verified, then running it in public",
    desc: "A chairman's office claims its LGA, waits for a Platform Admin to verify the claim, then manages everything citizens and investors see about it.",
    groups: [
      {
        label: "Getting in",
        steps: [
          { n: 1, route: "/lga-signup", title: "Register the LGA", img: "/user-journeys/lga-signup.jpg",
            desc: "Submits the LGA's official details — name, state, chairman, office address — with supporting documents attached." },
          { n: 2, route: "email OTP · admin review", title: "Verify & Await Approval", icon: Hourglass,
            desc: "Confirms the office email, then waits for a Platform Admin to review the documents and approve the claim.",
            crossLink: { role: "admin", id: "tile-lga-approvals", label: "Approved via Platform Admin" } },
          { n: 3, route: "/lga-login", title: "Sign In", img: "/user-journeys/lga-login.jpg",
            desc: "Signs in with the registered email. The session is a signed cookie scoped to exactly one LGA — a chairman can never act as another LGA." },
          { n: 4, route: "/lga-dashboard", title: "Dashboard Overview", icon: LayoutDashboard,
            desc: "Lands on a live summary of the LGA's projects, endowments, inquiries, and recent activity." },
        ],
      },
      {
        label: "Once inside, the dashboard covers",
        steps: [
          { route: "/lga-dashboard/endowments", title: "Endowments", icon: TrendingUp,
            desc: "Lists investment opportunities and natural endowments for investors to discover on the public profile." },
          { route: "/lga-dashboard/projects", title: "Projects", icon: HardHat,
            desc: "Publishes and updates infrastructure and development projects, from planning through completion." },
          { route: "/lga-dashboard/wards", title: "Wards & Councillors", icon: Users,
            desc: "Maintains the LGA's ward boundaries and each ward's elected councillor record." },
          { route: "/lga-dashboard/posts", title: "Posts & Updates", icon: MessageSquare,
            desc: "Shares day-to-day news with citizens following the LGA — comments here are moderated by Platform Admin." },
          { route: "/lga-dashboard/inquiries", title: "Investor Inquiries", icon: Mail, id: "tile-inquiries",
            desc: "Reviews and responds to investment inquiries forwarded from the public LGA profile." },
          { route: "/lga-dashboard/staff", title: "Staff Management", icon: Briefcase,
            desc: "Adds staff accounts with scoped publishing permission, without sharing the chairman's own login." },
          { route: "/lga-dashboard/press-releases", title: "Press Releases", icon: Newspaper,
            desc: "Issues official statements that appear on the platform's public news feed." },
          { route: "/lga-dashboard/tenure", title: "Tenure", icon: CalendarClock,
            desc: "Records the chairman's tenure start and end dates and keeps a history of past office holders." },
          { route: "/lga-dashboard/analytics", title: "Analytics", icon: BarChart2,
            desc: "Watches how citizens engage with the LGA's own posts, projects, and profile." },
          { route: "/lga-dashboard/payments", title: "Payments", icon: CreditCard,
            desc: "Manages the LGA's subscription and platform fees." },
          { route: "/lga-dashboard/settings", title: "Settings", icon: Settings,
            desc: "Updates the chairman's profile, security, and sign-out." },
        ],
      },
    ],
  },

  // ── INVESTOR ─────────────────────────────────────────────────────────
  {
    role: "investor",
    roleNum: "Role 03",
    heading: "From browsing endowments to a message in the chairman's inbox",
    desc: "Investors never need an account with a password — one form both registers their interest and delivers it straight to the right LGA.",
    groups: [
      {
        label: "The journey, in order",
        steps: [
          { n: 1, route: "/invest", title: "Discover Opportunities", img: "/user-journeys/invest.jpg",
            desc: "Registers a general investor profile — budget range, sectors of interest, country — or heads straight to a specific LGA's profile." },
          { n: 2, route: "/lgas/[lga-slug] · Investment", title: "Review an LGA's Investment Page", img: "/user-journeys/lga-profile-investment.jpg",
            desc: "Reads the natural endowments and listings an LGA has published, or finds none yet and contacts the desk directly." },
          { n: 3, route: "inline · no account needed", title: "Express Interest", img: "/user-journeys/investor-modal.jpg",
            desc: "Submits name, email, and a message describing their interest and capacity — no separate account to create first." },
          { n: 4, route: "confirmation", title: "Inquiry Sent", icon: CheckCircle2,
            desc: "Sees an immediate confirmation. The platform emails the LGA's official address on their behalf.",
            crossLink: { role: "chairman", id: "tile-inquiries", label: "Arrives in the Chairman's Inquiries" } },
          { n: 5, route: "off-platform", title: "The Chairman Responds", icon: Mail,
            desc: "The chairman follows up directly by email or phone — the platform's role ends at the introduction; no commission, no intermediary." },
        ],
      },
    ],
  },

  // ── PLATFORM ADMIN ───────────────────────────────────────────────────
  {
    role: "admin",
    roleNum: "Role 04",
    heading: "One console over all 774 Local Government Areas",
    desc: "A single, separately-authenticated console for verifying LGAs and moderating everything citizens, chairmen, and investors publish.",
    groups: [
      {
        label: "Getting in",
        steps: [
          { n: 1, route: "/admin/login", title: "Admin Sign In", img: "/user-journeys/admin-login.jpg",
            desc: "Signs in with a dedicated admin password — an entirely separate session from citizen or LGA logins." },
          { n: 2, route: "/admin", title: "Admin Overview", icon: LayoutDashboard,
            desc: "Sees platform-wide stats: pending approvals, active LGAs, recent inquiries, and flagged content awaiting review." },
        ],
      },
      {
        label: "The console covers",
        steps: [
          { route: "/admin/lgas", title: "LGA Approvals", icon: Building2, id: "tile-lga-approvals",
            desc: "Reviews submitted LGA registrations and documents, then approves or rejects each claim." },
          { route: "/admin/wards", title: "Wards", icon: MapPin,
            desc: "Corrects or bulk-imports ward and councillor records across any LGA." },
          { route: "/admin/users", title: "Users", icon: User,
            desc: "Manages citizen and investor accounts — suspends, verifies, or resets." },
          { route: "/admin/allocations", title: "Allocations", icon: Coins,
            desc: "Publishes the official monthly FAAC figures citizens compare against LGA claims." },
          { route: "/admin/procurement", title: "Procurement", icon: ClipboardCheck,
            desc: "Tracks public procurement records and contract awards for transparency reporting." },
          { route: "/admin/audit-reports", title: "Audit Reports", icon: ShieldCheck,
            desc: "Publishes independent audit findings on LGA spending." },
          { route: "/admin/press-releases", title: "Press Releases", icon: Newspaper,
            desc: "Issues platform-wide official announcements, separate from any single LGA's." },
          { route: "/admin/live-streams", title: "Live Streams", icon: Video,
            desc: "Schedules and links live broadcasts of council sessions and public events." },
          { route: "/admin/moderation", title: "Moderation", icon: Flag, id: "tile-moderation",
            desc: "Reviews flagged citizen comments and posts before or after they go public." },
          { route: "/admin/ads", title: "Ads", icon: Tag,
            desc: "Manages sponsored placements and advertiser campaigns across the platform." },
          { route: "/admin/revenue", title: "Revenue", icon: BarChart2,
            desc: "Tracks platform revenue from LGA subscriptions and advertising." },
          { route: "/admin/analytics", title: "Analytics", icon: TrendingUp,
            desc: "Watches platform-wide engagement and growth trends across all 774 LGAs." },
          { route: "/admin/expiring", title: "Expiring LGAs", icon: Timer,
            desc: "Flags LGA subscriptions nearing expiry so the platform team can follow up before access lapses." },
        ],
      },
    ],
  },
];

const TOTAL_SCREENS = Object.values(ROLE_META).reduce((sum, r) => sum + r.count, 0);

export default function UserJourneysClient() {
  const [active, setActive] = useState<Role>("citizen");
  const [highlight, setHighlight] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(highlight);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlight(null), 1700);
    return () => clearTimeout(t);
  }, [highlight]);

  function jump(role: Role, id: string) {
    setActive(role);
    requestAnimationFrame(() => setHighlight(id));
  }

  const section = SECTIONS.find((s) => s.role === active)!;

  return (
    <div>
      {/* Summary strip */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-x-8 gap-y-1.5 text-xs font-mono text-slate-500">
          <span><b className="text-slate-700 font-semibold">4</b> roles</span>
          <span><b className="text-slate-700 font-semibold">{TOTAL_SCREENS}</b> screens mapped</span>
          <span><b className="text-slate-700 font-semibold">2</b> cross-role handoffs traced</span>
          <span className="hidden sm:inline">rendered from the live routes of 774ng.com</span>
        </div>
      </div>

      {/* Role tabs */}
      <nav
        ref={tabsRef}
        className="sticky top-0 z-20 bg-white border-b border-slate-200"
        aria-label="Choose a role"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
          {(Object.keys(ROLE_META) as Role[]).map((role) => {
            const meta = ROLE_META[role];
            const Icon = meta.tabIcon;
            const isActive = active === role;
            return (
              <button
                key={role}
                onClick={() => setActive(role)}
                aria-selected={isActive}
                className={`flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-colors ${
                  isActive ? meta.tabActive : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-left">
                  <span className="block text-sm font-bold leading-tight">{meta.label}</span>
                  <span className="block text-[10px] font-mono text-slate-400 leading-tight">
                    {meta.count} screens
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active role panel */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="max-w-2xl mb-8">
          <p className={`text-xs font-mono font-semibold uppercase tracking-wider mb-2 ${ROLE_META[section.role].eyebrow}`}>
            {section.roleNum} &middot; {ROLE_META[section.role].label}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{section.heading}</h2>
          <p className="text-sm text-slate-500">{section.desc}</p>
        </div>

        {section.groups.map((group) => (
          <div key={group.label} className="mb-10 last:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                {group.label}
              </p>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.steps.map((step) => {
                const meta = ROLE_META[section.role];
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    id={step.id}
                    className={`relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow scroll-mt-24 ${
                      highlight === step.id ? `ring-4 ${meta.ring}` : ""
                    }`}
                  >
                    {step.n !== undefined && (
                      <span
                        className={`absolute top-2.5 left-2.5 z-10 h-6 w-6 rounded-full text-white text-[11px] font-mono font-bold flex items-center justify-center shadow ${meta.numBadge}`}
                      >
                        {step.n}
                      </span>
                    )}

                    {/* Chrome bar */}
                    <div className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 border-b border-slate-200">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      </span>
                      <span className="flex-1 min-w-0 bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] font-mono text-slate-500 truncate">
                        {step.route}
                      </span>
                    </div>

                    {/* Screenshot or diagram */}
                    <div className={`relative aspect-[15/10] ${meta.diagramBg}`}>
                      {step.img ? (
                        <Image src={step.img} alt={step.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover object-top" />
                      ) : Icon ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className={`h-9 w-9 ${meta.diagramIcon}`} strokeWidth={1.6} />
                        </div>
                      ) : null}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 text-sm mb-1.5">{step.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                      {step.crossLink && (
                        <button
                          onClick={() => jump(step.crossLink!.role, step.crossLink!.id)}
                          className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${meta.chip}`}
                        >
                          {step.crossLink.label}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
