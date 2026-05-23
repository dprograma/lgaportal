"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User } from "lucide-react";

interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  user:      { id: string; name: string; image: string | null };
}

interface Props {
  postId:      string;
  isLoggedIn:  boolean;
  onLoginRequired: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommentSection({ postId, isLoggedIn, onLoginRequired }: Props) {
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore,setLoadingMore]= useState(false);
  const [offset,     setOffset]     = useState(0);
  const [text,       setText]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const LIMIT = 20;

  async function fetchComments(off: number, append = false) {
    try {
      const res  = await fetch(`/api/comments?postId=${postId}&limit=${LIMIT}&offset=${off}`);
      const data = await res.json();
      setComments((prev) => append ? [...prev, ...data.comments] : data.comments);
      setTotal(data.total ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => { fetchComments(0); }, [postId]);

  async function handleLoadMore() {
    const newOffset = offset + LIMIT;
    setLoadingMore(true);
    setOffset(newOffset);
    await fetchComments(newOffset, true);
  }

  async function handleSubmit() {
    if (!isLoggedIn) { onLoginRequired(); return; }
    const trimmed = text.trim();
    if (!trimmed)              { setError("Comment cannot be empty."); return; }
    if (trimmed.length > 500)  { setError("Maximum 500 characters."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res  = await fetch("/api/comments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId, content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to post comment."); return; }
      // Prepend new comment
      setComments((prev) => [data.comment, ...prev]);
      setTotal((t) => t + 1);
      setText("");
      textareaRef.current?.blur();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 pb-5 pt-3 border-t border-slate-100">
      {/* Input */}
      <div className="mb-4">
        <div className="flex gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); }}
              onFocus={() => { if (!isLoggedIn) { onLoginRequired(); (document.activeElement as HTMLElement)?.blur(); } }}
              placeholder={isLoggedIn ? "Write a comment…" : "Log in to comment…"}
              rows={2}
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-xs ${text.length > 480 ? "text-red-500" : "text-slate-400"}`}>
                {text.length}/500
              </span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !text.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
              >
                {submitting
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Send className="h-3 w-3" />
                }
                Post
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        </div>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-xs font-bold text-green-700">
                {c.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800">{c.user.name}</span>
                  <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}

          {/* Load more */}
          {comments.length < total && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 text-xs text-green-700 hover:text-green-800 font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {loadingMore ? "Loading…" : `Load ${Math.min(LIMIT, total - comments.length)} more comments`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
