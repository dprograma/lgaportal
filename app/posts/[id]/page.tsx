"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, CalendarDays, Eye,
  Share2, Check, Loader2,
} from "lucide-react";
import ReactionBar from "@/components/engagement/ReactionBar";
import CommentSection from "@/components/engagement/CommentSection";
import ReportButton from "@/components/engagement/ReportButton";

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
  lga: { id: string; lgaName: string; state: string };
  reactionCounts: Record<string, number>;
  commentCount: number;
}

function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* noop */ }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
        <Share2 className="h-3.5 w-3.5" /> Share:
      </span>
      <a href={`https://wa.me/?text=${enc(title)}%20${enc(url)}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold transition-colors">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-[#1a1a1a] text-white text-xs font-semibold transition-colors">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold transition-colors">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </a>
      <button onClick={copy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
        {copied ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copied!</> : "Copy Link"}
      </button>
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post,     setPost]     = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pageUrl,  setPageUrl]  = useState("");

  useEffect(() => { setPageUrl(window.location.href); }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setNotFound(true); else setPost(d.post); })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-700 mb-2">Post Not Found</p>
        <Link href="/lgas" className="text-green-700 font-semibold hover:underline">← Browse LGAs</Link>
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );

  const publishDate = post.publishedAt ?? post.createdAt;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Dark header */}
      <div className="bg-[#071a0e] text-white px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <Link href={`/lgas/${post.lga.id}`}
            className="inline-flex items-center gap-1.5 text-green-300 text-xs mb-6 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            {post.lga.lgaName} LGA
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/50 border border-green-700/40 text-green-300 text-xs font-semibold mb-4">
            <Building2 className="h-3.5 w-3.5" />
            {post.lga.lgaName} LGA · {post.lga.state} State
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-3">
            {post.title}
          </h1>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-green-200/70 text-xs">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(publishDate).toLocaleDateString("en-NG", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount.toLocaleString()} views
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        {/* Cover image */}
        {post.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt={post.title} className="w-full object-cover max-h-72" />
          </div>
        )}

        {/* Body */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
          <div
            className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br />") }}
          />
        </div>

        {/* Reactions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <ReactionBar
            contentId={post.id}
            contentType="post"
            initialCounts={post.reactionCounts}
          />
        </div>

        {/* Share */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <ShareBar title={post.title} url={pageUrl} />
        </div>

        {/* Comments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <CommentSection postId={post.id} />
        </div>

        {/* Report */}
        <div className="flex justify-end">
          <ReportButton contentId={post.id} contentType="post" />
        </div>
      </div>
    </div>
  );
}
