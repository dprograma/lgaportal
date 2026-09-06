"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ROLE_META, SECTIONS, TOTAL_SCREENS, type Role } from "@/lib/user-journeys-data";

export default function UserJourneysClient() {
  const [active, setActive] = useState<Role>("citizen");
  const router = useRouter();
  const section = SECTIONS.find((s) => s.role === active)!;

  return (
    <div>
      {/* Summary strip */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-x-8 gap-y-1.5 text-xs font-mono text-slate-500">
          <span><b className="text-slate-700 font-semibold">4</b> roles</span>
          <span><b className="text-slate-700 font-semibold">{TOTAL_SCREENS}</b> screens mapped</span>
          <span><b className="text-slate-700 font-semibold">29</b> screens with a full detail page</span>
          <span className="hidden sm:inline">rendered from the live routes of 774ng.com</span>
        </div>
      </div>

      {/* Role tabs */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-200" aria-label="Choose a role">
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
                const clickable = Boolean(step.slug);

                const cardInner = (
                  <>
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
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
                        {clickable && (
                          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-0.5 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                      {step.crossLink && (
                        <Link
                          href={
                            step.crossLink.slug
                              ? `/user-journeys/${step.crossLink.role}/${step.crossLink.slug}`
                              : `/user-journeys#${step.crossLink.id}`
                          }
                          onClick={(e) => e.stopPropagation()}
                          className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${meta.chip}`}
                        >
                          {step.crossLink.label}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                      {clickable && (
                        <p className={`mt-3 text-[11px] font-semibold ${meta.eyebrow}`}>View details &rarr;</p>
                      )}
                    </div>
                  </>
                );

                const cardClass = `group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-shadow ${
                  clickable ? "hover:shadow-md hover:border-slate-300 cursor-pointer" : ""
                }`;

                const href = `/user-journeys/${section.role}/${step.slug}`;

                // A card that is itself clickable AND carries a nested cross-link
                // button can't be an <a> (that button is also an <a>, and an
                // anchor can't contain another anchor). Use a div with the same
                // click behavior instead; plain clickable cards stay real <Link>s.
                if (clickable && step.crossLink) {
                  return (
                    <div
                      key={step.title}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => { if (e.key === "Enter") router.push(href); }}
                      className={cardClass}
                    >
                      {cardInner}
                    </div>
                  );
                }

                return clickable ? (
                  <Link key={step.title} href={href} className={cardClass}>
                    {cardInner}
                  </Link>
                ) : (
                  <article key={step.title} id={step.id} className={cardClass}>
                    {cardInner}
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
