"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  title: string;
  url: string;
  imageUrl?: string;
  contentId?: string;
  contentType?: "post" | "project";
}

export default function ShareButtons({ title, url, contentId, contentType = "project" }: Props) {
  const [copied, setCopied] = useState(false);

  function trackShare() {
    if (!contentId) return;
    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, contentType }),
    }).catch(() => null);
  }

  function shareWhatsApp() {
    trackShare();
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(`https://wa.me/send?text=${text}`, "_blank", "noopener");
  }

  function shareTwitter() {
    trackShare();
    const text = encodeURIComponent(title);
    const u = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${u}`, "_blank", "noopener");
  }

  function shareFacebook() {
    trackShare();
    const u = encodeURIComponent(url);
    window.open(`https://facebook.com/sharer/sharer.php?u=${u}`, "_blank", "noopener");
  }

  async function copyLink() {
    trackShare();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-slate-500 mr-1">Share:</span>

      {/* WhatsApp */}
      <button
        onClick={shareWhatsApp}
        title="Share on WhatsApp"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#25D366] text-white hover:opacity-90 transition-opacity"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.1.546 4.072 1.5 5.786L0 24l6.344-1.488A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.922 0-3.716-.531-5.244-1.45l-.376-.224-3.895.914.947-3.782-.246-.39A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      {/* Twitter/X */}
      <button
        onClick={shareTwitter}
        title="Share on X (Twitter)"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black text-white hover:opacity-80 transition-opacity"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span className="hidden sm:inline">Twitter</span>
      </button>

      {/* Facebook */}
      <button
        onClick={shareFacebook}
        title="Share on Facebook"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className="hidden sm:inline">Facebook</span>
      </button>

      {/* Copy link */}
      <button
        onClick={copyLink}
        title="Copy link"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{copied ? "Copied!" : "Copy link"}</span>
      </button>
    </div>
  );
}
