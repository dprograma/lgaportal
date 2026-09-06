import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { findStep, ROLE_META, SECTIONS, type Role } from "@/lib/user-journeys-data";

const ROLES: Role[] = ["citizen", "chairman", "investor", "admin"];

export function generateStaticParams() {
  const params: { role: Role; slug: string }[] = [];
  for (const section of SECTIONS) {
    for (const group of section.groups) {
      for (const step of group.steps) {
        if (step.slug) params.push({ role: section.role, slug: step.slug });
      }
    }
  }
  return params;
}

type Props = { params: Promise<{ role: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { role: roleParam, slug } = await params;
  const role = roleParam as Role;
  if (!ROLES.includes(role)) return {};
  const found = findStep(role, slug);
  if (!found) return {};
  return {
    title: `${found.step.title} – User Journeys – 774ng.com`,
    description: found.step.detail?.overview ?? found.step.desc,
  };
}

export default async function JourneyDetailPage({ params }: Props) {
  const { role: roleParam, slug } = await params;
  const role = roleParam as Role;
  if (!ROLES.includes(role)) notFound();

  const found = findStep(role, slug);
  if (!found) notFound();
  const { step, section } = found;
  const meta = ROLE_META[section.role];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/user-journeys"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to User Journeys
          </Link>
          <p className={`text-xs font-mono font-semibold uppercase tracking-wider mb-2 ${meta.eyebrow}`}>
            {section.roleNum} &middot; {meta.label}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{step.title}</h1>
          <p className="inline-block bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono text-slate-500">
            {step.route}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Banner */}
        <div className={`relative rounded-2xl overflow-hidden border ${meta.accentBorder} mb-8 aspect-[16/9] ${meta.diagramBg}`}>
          {step.img ? (
            <Image src={step.img} alt={step.title} fill sizes="(max-width:768px) 100vw, 768px" className="object-cover object-top" />
          ) : Icon ? (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className={`h-16 w-16 ${meta.diagramIcon}`} strokeWidth={1.4} />
            </div>
          ) : null}
        </div>

        {step.detail ? (
          <>
            <p className="text-base text-slate-700 leading-relaxed mb-6">{step.detail.overview}</p>

            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              What happens here
            </h2>
            <ul className="space-y-2.5 mb-6">
              {step.detail.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${meta.accentText}`} />
                  {b}
                </li>
              ))}
            </ul>

            {step.detail.note && (
              <div className={`rounded-xl border ${meta.accentBorder} ${meta.diagramBg} px-4 py-3 mb-6`}>
                <p className="text-xs text-slate-600">{step.detail.note}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-base text-slate-700 leading-relaxed mb-6">{step.desc}</p>
        )}

        {step.crossLink && (
          <Link
            href={
              step.crossLink.slug
                ? `/user-journeys/${step.crossLink.role}/${step.crossLink.slug}`
                : `/user-journeys#${step.crossLink.id}`
            }
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${meta.chip}`}
          >
            {step.crossLink.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/user-journeys" className="hover:text-green-700 transition-colors">
            All User Journeys
          </Link>
          <Link href="/how-it-works" className="hover:text-green-700 transition-colors">
            How It Works
          </Link>
        </div>
      </div>
    </div>
  );
}
