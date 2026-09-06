import {
  User, Building2, TrendingUp, ShieldCheck,
  MailCheck, UserCircle, Settings, Search,
  MessageSquare, Hourglass, LayoutDashboard, HardHat,
  Users, Mail, Briefcase, Newspaper, CalendarClock, CreditCard,
  CheckCircle2, MapPin, Coins, ClipboardCheck, Video,
  Flag, Tag, BarChart2, Timer,
  type LucideIcon,
} from "lucide-react";

export type Role = "citizen" | "chairman" | "investor" | "admin";

export interface StepDetail {
  overview: string;
  bullets: string[];
  note?: string;
}

export interface CrossLink {
  role: Role;
  /** Slug of the target step when it has its own detail page. */
  slug?: string;
  /** Anchor id on the main listing page, used when the target has no detail page. */
  id?: string;
  label: string;
}

export interface Step {
  n?: number;
  /** Present only for steps that link through to a detail page. */
  slug?: string;
  route: string;
  title: string;
  desc: string;
  img?: string;
  icon?: LucideIcon;
  id?: string;
  crossLink?: CrossLink;
  detail?: StepDetail;
}

export interface Group {
  label: string;
  steps: Step[];
}

export interface RoleSection {
  role: Role;
  roleNum: string;
  heading: string;
  desc: string;
  groups: Group[];
}

export const ROLE_META: Record<
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
    accentText: string;
    accentBorder: string;
  }
> = {
  citizen: {
    label: "Citizen", count: 10, tabIcon: User,
    tabActive: "bg-blue-50 border-blue-600 text-blue-800",
    numBadge: "bg-blue-700",
    chip: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
    eyebrow: "text-blue-700", diagramBg: "bg-blue-50", diagramIcon: "text-blue-700",
    ring: "ring-blue-400", accentText: "text-blue-700", accentBorder: "border-blue-200",
  },
  chairman: {
    label: "LGA Chairman", count: 15, tabIcon: Building2,
    tabActive: "bg-green-50 border-green-600 text-green-800",
    numBadge: "bg-green-700",
    chip: "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
    eyebrow: "text-green-700", diagramBg: "bg-green-50", diagramIcon: "text-green-700",
    ring: "ring-green-400", accentText: "text-green-700", accentBorder: "border-green-200",
  },
  investor: {
    label: "Investor", count: 5, tabIcon: TrendingUp,
    tabActive: "bg-amber-50 border-amber-500 text-amber-800",
    numBadge: "bg-amber-600",
    chip: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
    eyebrow: "text-amber-700", diagramBg: "bg-amber-50", diagramIcon: "text-amber-700",
    ring: "ring-amber-400", accentText: "text-amber-700", accentBorder: "border-amber-200",
  },
  admin: {
    label: "Platform Admin", count: 15, tabIcon: ShieldCheck,
    tabActive: "bg-violet-50 border-violet-600 text-violet-800",
    numBadge: "bg-violet-700",
    chip: "bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100",
    eyebrow: "text-violet-700", diagramBg: "bg-violet-50", diagramIcon: "text-violet-700",
    ring: "ring-violet-400", accentText: "text-violet-700", accentBorder: "border-violet-200",
  },
};

export const SECTIONS: RoleSection[] = [
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
            crossLink: { role: "admin", slug: "moderation", label: "Comments queue for Platform Admin" } },
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
            crossLink: { role: "admin", slug: "lga-approvals", label: "Approved via Platform Admin" } },
          { n: 3, route: "/lga-login", title: "Sign In", img: "/user-journeys/lga-login.jpg",
            desc: "Signs in with the registered email. The session is a signed cookie scoped to exactly one LGA — a chairman can never act as another LGA." },
          { n: 4, route: "/lga-dashboard", title: "Dashboard Overview", icon: LayoutDashboard,
            desc: "Lands on a live summary of the LGA's projects, endowments, inquiries, and recent activity." },
        ],
      },
      {
        label: "Once inside, the dashboard covers",
        steps: [
          { slug: "endowments", route: "/lga-dashboard/endowments", title: "Endowments", icon: TrendingUp,
            desc: "Lists investment opportunities and natural endowments for investors to discover on the public profile.",
            detail: {
              overview: "Endowments are the natural resources and investment opportunities an LGA publishes for outside capital to find — solid minerals, agriculture, tourism sites, energy potential, and more.",
              bullets: [
                "Add a title, category, description, and highlights for each opportunity",
                "Set an investment range so investors can self-filter by ticket size",
                "Publish or unpublish a listing at any time",
                "Every listing appears on the LGA's public Investment tab, where an investor can Express Interest directly",
              ],
            } },
          { slug: "projects", route: "/lga-dashboard/projects", title: "Projects", icon: HardHat,
            desc: "Publishes and updates infrastructure and development projects, from planning through completion.",
            detail: {
              overview: "Projects are the LGA's public record of infrastructure and development work — what's planned, what's underway, and what's finished.",
              bullets: [
                "Publish a project with a title, sector, budget, and timeline",
                "Update its status as work moves from planning to completion",
                "Attach a location so it appears correctly on the public map",
                "Citizens see the same record on the LGA's public profile and can track progress over time",
              ],
            } },
          { slug: "wards", route: "/lga-dashboard/wards", title: "Wards & Councillors", icon: Users,
            desc: "Maintains the LGA's ward boundaries and each ward's elected councillor record.",
            detail: {
              overview: "Wards & Councillors is the LGA's own register of its ward boundaries and the elected councillor representing each one.",
              bullets: [
                "Add a ward with a name, ward number, and estimated population",
                "Record the councillor's name, email, phone, and photo",
                "Write a short description of key communities within the ward",
                "The same records can be bulk-corrected via an export-and-reupload spreadsheet",
              ],
            } },
          { slug: "posts", route: "/lga-dashboard/posts", title: "Posts & Updates", icon: MessageSquare,
            desc: "Shares day-to-day news with citizens following the LGA — comments here are moderated by Platform Admin.",
            detail: {
              overview: "Posts & Updates is the LGA's day-to-day news feed — the fastest way to reach citizens already following it.",
              bullets: [
                "Publish short updates with text and optional images",
                "Citizens following the LGA can comment directly on each post",
                "Comments are queued for Platform Admin moderation before or after they go live",
              ],
              note: "Flagged comments are reviewed under Platform Admin's Moderation.",
            } },
          { slug: "inquiries", route: "/lga-dashboard/inquiries", title: "Investor Inquiries", icon: Mail, id: "tile-inquiries",
            desc: "Reviews and responds to investment inquiries forwarded from the public LGA profile.",
            detail: {
              overview: "Investor Inquiries is where every message submitted through the LGA's public Investment tab lands.",
              bullets: [
                "See the investor's name, email, and message, alongside which endowment (if any) they asked about",
                "Reply directly by email — the platform's role ends at the introduction",
                "Nothing here is publicly visible; inquiries contain investor contact details",
              ],
              note: "This is where an investor's Express Interest submission arrives.",
            } },
          { slug: "staff", route: "/lga-dashboard/staff", title: "Staff Management", icon: Briefcase,
            desc: "Adds staff accounts with scoped publishing permission, without sharing the chairman's own login.",
            detail: {
              overview: "Staff Management lets a chairman delegate day-to-day publishing without ever sharing their own login.",
              bullets: [
                "Add a staff account with a full name, email, and temporary password",
                "Each staff session is scoped — publishing permission is set per account",
                "Deactivate a staff account at any time; the chairman's own credentials are never exposed",
              ],
            } },
          { slug: "press-releases", route: "/lga-dashboard/press-releases", title: "Press Releases", icon: Newspaper,
            desc: "Issues official statements that appear on the platform's public news feed.",
            detail: {
              overview: "Press Releases are official statements meant for the platform's public news feed, not just the LGA's own page.",
              bullets: [
                "Write a headline, full body text, and attach a supporting document or link",
                "Every release starts as Pending Review",
                "Platform Admin approves or rejects it before it appears on the public news feed",
              ],
              note: "Reviewed under Platform Admin's own Press Releases queue.",
            } },
          { slug: "tenure", route: "/lga-dashboard/tenure", title: "Tenure", icon: CalendarClock,
            desc: "Records the chairman's tenure start and end dates and keeps a history of past office holders.",
            detail: {
              overview: "Tenure records exactly when the current chairman's term began and is due to end, plus a history of who held office before.",
              bullets: [
                "Set a tenure start date and, once known, an end date",
                "Attach supporting documentation — e.g. an INEC certificate — as evidence of the term",
                "Past chairmen remain on record as tenure history rather than being deleted",
              ],
            } },
          { slug: "analytics", route: "/lga-dashboard/analytics", title: "Analytics", icon: BarChart2,
            desc: "Watches how citizens engage with the LGA's own posts, projects, and profile.",
            detail: {
              overview: "Analytics shows how citizens are actually engaging with this LGA's own content — not platform-wide numbers, just this one.",
              bullets: [
                "Track views and engagement on posts, projects, and the public profile",
                "See which endowments are drawing investor attention",
                "Use it to decide what to publish more of",
              ],
            } },
          { slug: "payments", route: "/lga-dashboard/payments", title: "Payments", icon: CreditCard,
            desc: "Manages the LGA's subscription and platform fees.",
            detail: {
              overview: "Payments & Billing is where the LGA manages its own subscription and any platform fees.",
              bullets: [
                "View past transactions and current subscription status",
                "Pay to renew before the trial or subscription period lapses",
                "An LGA nearing expiry also surfaces on Platform Admin's Expiring Trials list",
              ],
              note: "Tracked platform-wide under Platform Admin's Expiring Trials.",
            } },
          { slug: "settings", route: "/lga-dashboard/settings", title: "Settings", icon: Settings,
            desc: "Updates the chairman's profile, security, and sign-out.",
            detail: {
              overview: "Settings covers the chairman's own account, separate from the LGA's public profile.",
              bullets: [
                "Update the chairman's name, email, and password",
                "Sign out of the current session",
                "Session security is a signed cookie scoped to this LGA only",
              ],
            } },
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
          { n: 1, slug: "discover", route: "/invest", title: "Discover Opportunities", img: "/user-journeys/invest.jpg",
            desc: "Registers a general investor profile — budget range, sectors of interest, country — or heads straight to a specific LGA's profile.",
            detail: {
              overview: "An investor's first stop — register a general profile once, or skip straight to a specific LGA.",
              bullets: [
                "Share budget range, sectors of interest, and country so LGAs understand what you're looking for",
                "No password required — this is a lead-capture form, not an account",
                "From here, browse any of the 774 LGA profiles for a specific opportunity",
              ],
            } },
          { n: 2, slug: "review-investment-page", route: "/lgas/[lga-slug] · Investment", title: "Review an LGA's Investment Page", img: "/user-journeys/lga-profile-investment.jpg",
            desc: "Reads the natural endowments and listings an LGA has published, or finds none yet and contacts the desk directly.",
            detail: {
              overview: "Every LGA has an Investment tab listing whatever endowments it has chosen to publish.",
              bullets: [
                "See each listing's title, category, description, highlights, and investment range",
                "If nothing is listed yet, a “Contact Investment Desk” button reaches the LGA directly",
                "This is the same page a citizen can browse — investment data is public by design",
              ],
            } },
          { n: 3, slug: "express-interest", route: "inline · no account needed", title: "Express Interest", img: "/user-journeys/investor-modal.jpg",
            desc: "Submits name, email, and a message describing their interest and capacity — no separate account to create first.",
            detail: {
              overview: "One form is the entire investor “application” — no account, no password, no waiting for approval to make first contact.",
              bullets: [
                "Provide a name, email, and a message describing interest and capacity",
                "Submitting also registers (or reuses) an investor profile behind the scenes",
                "The message can reference a specific endowment or be a general inquiry",
              ],
            } },
          { n: 4, slug: "inquiry-sent", route: "confirmation", title: "Inquiry Sent", icon: CheckCircle2,
            desc: "Sees an immediate confirmation. The platform emails the LGA's official address on their behalf.",
            crossLink: { role: "chairman", slug: "inquiries", label: "Arrives in the Chairman's Inquiries" },
            detail: {
              overview: "Confirmation that the message has left the platform and is now the LGA's to answer.",
              bullets: [
                "The platform emails the LGA's official registered address immediately",
                "The inquiry is filed in that LGA's own dashboard, visible only to its chairman or staff",
                "No commission or fee changes hands on the platform for this introduction",
              ],
            } },
          { n: 5, slug: "chairman-responds", route: "off-platform", title: "The Chairman Responds", icon: Mail,
            desc: "The chairman follows up directly by email or phone — the platform's role ends at the introduction; no commission, no intermediary.",
            detail: {
              overview: "The introduction is the platform's whole job — everything after this happens directly between investor and LGA.",
              bullets: [
                "The chairman follows up using the email or phone the investor provided",
                "Negotiation, due diligence, and any agreement happen off-platform",
                "The platform keeps no record of outcomes beyond the original inquiry",
              ],
            } },
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
          { slug: "lga-approvals", route: "/admin/lgas", title: "LGA Approvals", icon: Building2, id: "tile-lga-approvals",
            desc: "Reviews submitted LGA registrations and documents, then approves or rejects each claim.",
            detail: {
              overview: "Every LGA on the platform starts here — a claim isn't public until Platform Admin verifies it.",
              bullets: [
                "Review the submitted chairman details, office address, and uploaded documents",
                "Approve to make the LGA's profile public and unlock the chairman's dashboard login",
                "Reject with a reason, or hold for more information",
              ],
              note: "This is what a chairman's registration is waiting on.",
            } },
          { slug: "wards", route: "/admin/wards", title: "Wards", icon: MapPin,
            desc: "Corrects or bulk-imports ward and councillor records across any LGA.",
            detail: {
              overview: "Ward and councillor data an LGA gets wrong or leaves incomplete can be corrected centrally, without waiting on the chairman.",
              bullets: [
                "Search and edit any LGA's ward records directly",
                "Bulk-import corrected data via the same spreadsheet round-trip LGAs use themselves",
                "Especially useful right after an LGA is first approved, when its ward list is often incomplete",
              ],
            } },
          { slug: "users", route: "/admin/users", title: "Users", icon: User,
            desc: "Manages citizen and investor accounts — suspends, verifies, or resets.",
            detail: {
              overview: "Users covers every citizen and investor account on the platform — LGA chairman accounts are managed separately, under LGA Approvals.",
              bullets: [
                "Suspend an account that violates platform rules",
                "Verify an email manually if automated verification fails",
                "Reset a password on a citizen's behalf when support requests it",
              ],
            } },
          { slug: "allocations", route: "/admin/allocations", title: "Allocations", icon: Coins,
            desc: "Publishes the official monthly FAAC figures citizens compare against LGA claims.",
            detail: {
              overview: "Allocations is the platform's own record of what the federal government released each month — the figure citizens compare LGA claims against.",
              bullets: [
                "Publish or correct a monthly FAAC figure by state and LGA",
                "Bulk-import a month's release via a styled spreadsheet export-and-reupload flow",
                "Once published, the same data appears on the public allocations tracker",
              ],
            } },
          { slug: "procurement", route: "/admin/procurement", title: "Procurement", icon: ClipboardCheck,
            desc: "Tracks public procurement records and contract awards for transparency reporting.",
            detail: {
              overview: "Procurement Contracts is a public transparency record of contracts awarded across any LGA.",
              bullets: [
                "Add a contract with a title, contractor name, and contract value",
                "Attach it to a specific LGA by search",
                "Cited alongside audit reports in the platform's transparency reporting",
              ],
            } },
          { slug: "audit-reports", route: "/admin/audit-reports", title: "Audit Reports", icon: ShieldCheck,
            desc: "Publishes independent audit findings on LGA spending.",
            detail: {
              overview: "Audit Reports publishes independent findings on how an LGA has spent its money.",
              bullets: [
                "Add a report title, the auditing body's name, and a link to the full report",
                "Attribute the upload for accountability",
                "Attach it to a specific LGA by search",
              ],
            } },
          { slug: "press-releases", route: "/admin/press-releases", title: "Press Releases", icon: Newspaper,
            desc: "Issues platform-wide official announcements, separate from any single LGA's.",
            detail: {
              overview: "Covers platform-wide official announcements, plus the review queue every LGA chairman's press release must clear before it's public.",
              bullets: [
                "Approve or reject a release an LGA chairman submitted",
                "Publish announcements that come directly from the platform, not any single LGA",
                "A rejected release stays private to that LGA's own dashboard",
              ],
              note: "This is where a chairman's submitted press release is reviewed.",
            } },
          { slug: "live-streams", route: "/admin/live-streams", title: "Live Streams", icon: Video,
            desc: "Schedules and links live broadcasts of council sessions and public events.",
            detail: {
              overview: "Schedules and links live broadcasts — council sessions, town halls, public events — for any LGA.",
              bullets: [
                "Add a title, a video link, and a short description",
                "Mark a stream Upcoming, Live Now, or Ended",
                "Streams appear on the platform's public Live page",
              ],
            } },
          { slug: "moderation", route: "/admin/moderation", title: "Moderation", icon: Flag, id: "tile-moderation",
            desc: "Reviews flagged citizen comments and posts before or after they go public.",
            detail: {
              overview: "Every flagged citizen comment or post, on any LGA's page, is queued here for a human decision.",
              bullets: [
                "Review a flag report alongside the original content",
                "Approve, remove, or warn — every action is written to a moderation log",
                "The backstop for the comments citizens leave on LGA posts",
              ],
              note: "This is where a citizen's flagged comment ends up.",
            } },
          { slug: "ads", route: "/admin/ads", title: "Ads", icon: Tag,
            desc: "Manages sponsored placements and advertiser campaigns across the platform.",
            detail: {
              overview: "Ads Management runs the platform's own advertiser program, separate from LGA content.",
              bullets: [
                "Review pending ad campaigns before they go live",
                "Manage ad plans — the pricing tiers advertisers can buy into",
                "See every campaign, active or not, in one place",
              ],
            } },
          { slug: "revenue", route: "/admin/revenue", title: "Revenue", icon: BarChart2,
            desc: "Tracks platform revenue from LGA subscriptions and advertising.",
            detail: {
              overview: "Revenue Dashboard is the platform's own business number, not any LGA's.",
              bullets: [
                "Track total revenue and this month's figure",
                "See active campaign count and how much is still pending review",
                "The same subscription fees LGAs pay under Payments & Billing roll up here",
              ],
            } },
          { slug: "analytics", route: "/admin/analytics", title: "Analytics", icon: TrendingUp,
            desc: "Watches platform-wide engagement and growth trends across all 774 LGAs.",
            detail: {
              overview: "Platform-wide engagement and growth trends across all 774 LGAs at once — where an LGA's own Analytics is scoped to itself, this one isn't.",
              bullets: [
                "Watch signups, engagement, and content volume trend over time",
                "Spot which states or LGAs are most active",
                "Use it to prioritize onboarding and support effort",
              ],
            } },
          { slug: "expiring", route: "/admin/expiring", title: "Expiring LGAs", icon: Timer,
            desc: "Flags LGA subscriptions nearing expiry so the platform team can follow up before access lapses.",
            detail: {
              overview: "Expiring Trials flags LGA subscriptions approaching their end date before access lapses.",
              bullets: [
                "See which LGAs are closest to expiry, soonest first",
                "Send a renewal reminder directly from the list",
                "Feeds the same subscription data an LGA sees under its own Payments & Billing",
              ],
            } },
        ],
      },
    ],
  },
];

export function findStep(role: Role, slug: string): { step: Step; section: RoleSection } | null {
  const section = SECTIONS.find((s) => s.role === role);
  if (!section) return null;
  for (const group of section.groups) {
    const step = group.steps.find((s) => s.slug === slug);
    if (step) return { step, section };
  }
  return null;
}

export const TOTAL_SCREENS = Object.values(ROLE_META).reduce((sum, r) => sum + r.count, 0);
