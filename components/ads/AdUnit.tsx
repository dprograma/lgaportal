"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ad {
  id: string;
  title: string;
  creativeUrl?: string;
  linkUrl: string;
  format: string;
  placement: string;
}

interface AdUnitProps {
  placement: string;
  className?: string;
}

export function AdUnit({ placement, className = "" }: AdUnitProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/ads?placement=${encodeURIComponent(placement)}`)
      .then((r) => r.json())
      .then((data) => {
        setAd(data.ad ?? null);
      })
      .catch(() => setAd(null))
      .finally(() => setLoaded(true));
  }, [placement]);

  function trackClick() {
    if (!ad) return;
    fetch(`/api/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
  }

  if (!loaded || !ad) return null;

  return (
    <div className={`relative ${className}`}>
      {/* "Ad" badge */}
      <span className="absolute top-1 left-1 z-10 bg-slate-900/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
        Ad
      </span>

      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={trackClick}
        className="block w-full"
      >
        {ad.creativeUrl ? (
          /* Image ad */
          <div className="w-full overflow-hidden rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.creativeUrl}
              alt={ad.title}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          /* Text / sponsored card */
          <div className="w-full bg-gradient-to-br from-green-50 to-slate-50 border border-slate-200 hover:border-green-300 rounded-xl p-4 transition-all hover:shadow-md">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                Sponsored
              </span>
            </div>
            <p className="font-semibold text-slate-800 text-sm leading-tight">{ad.title}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {new URL(ad.linkUrl).hostname}
            </p>
          </div>
        )}
      </a>
    </div>
  );
}
