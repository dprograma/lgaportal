"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, Reply, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  userId: string;
  user: CommentUser;
  replies?: CommentItem[];
}

interface Props {
  contentId: string;
  contentType: "post" | "project";
  // Legacy props (kept for backward compat with PostCard)
  postId?: string;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
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

const STAFF_ROLES = ["LGA_CHAIRMAN", "LGA_STAFF"];

export default function CommentSection({
  contentId,
  contentType,
  postId,
  isLoggedIn: isLoggedInProp,
  onLoginRequired,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  // Support legacy postId-only usage
  const resolvedContentId = contentId ?? postId ?? "";
  const resolvedContentType: "post" | "project" = contentType ?? "post";

  const isLoggedIn = isLoggedInProp ?? !!session?.user?.id;
  const isStaff = STAFF_ROLES.includes(session?.user?.role ?? "");

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function fetchComments(p: number, append = false) {
    try {
      // Support both new (contentId/contentType) and legacy (postId) API
      const url = resolvedContentId
        ? `/api/comments?contentId=${resolvedContentId}&contentType=${resolvedContentType}&page=${p}`
        : `/api/comments?postId=${postId}&limit=20&offset=${(p - 1) * 20}`;
      const res = await fetch(url);
      const data = await res.json();
      setComments((prev) => append ? [...prev, ...(data.comments ?? [])] : (data.comments ?? []));
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => { fetchComments(1); }, [resolvedContentId, resolvedContentType]);

  async function handleLoadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    setPage(nextPage);
    await fetchComments(nextPage, true);
  }

  function requireLogin(action = "comment") {
    if (onLoginRequired) { onLoginRequired(); return; }
    router.push("/login");
  }

  async function handleSubmit() {
    if (!isLoggedIn) { requireLogin(); return; }
    const trimmed = text.trim();
    if (!trimmed) { setError("Comment cannot be empty."); return; }
    if (trimmed.length > 500) { setError("Maximum 500 characters."); return; }
    setError("");
    setSubmitting(true);
    try {
      const body = resolvedContentId
        ? { contentId: resolvedContentId, contentType: resolvedContentType, content: trimmed }
        : { postId, content: trimmed };
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to post comment."); return; }
      if (data.held) {
        setError("Your comment is being reviewed before publishing.");
      } else {
        setComments((prev) => [data.comment, ...prev]);
        setTotal((t) => t + 1);
      }
      setText("");
      textareaRef.current?.blur();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!isLoggedIn) { requireLogin(); return; }
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setReplySubmitting(true);
    try {
      const prefix = isStaff ? "[LGA Response] " : "";
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: resolvedContentId,
          contentType: resolvedContentType,
          content: prefix + trimmed,
          parentId,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.held) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies ?? []), data.comment] }
              : c
          )
        );
        setReplyingTo(null);
        setReplyText("");
      }
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleEdit(id: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data.comment } : c))
        );
        setEditingId(null);
      }
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    }
  }

  function CommentCard({ c, depth = 0 }: { c: CommentItem; depth?: number }) {
    const isOwn = session?.user?.id === c.userId;
    const isLgaResponse = c.content.startsWith("[LGA Response]");

    return (
      <div className={`${depth > 0 ? "ml-8 border-l-2 border-green-100 pl-4" : ""}`}>
        <div className="flex gap-2.5">
          {c.user.image ? (
            <img src={c.user.image} alt={c.user.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-xs font-bold text-green-700">
              {c.user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-800">{c.user.name}</span>
              {isLgaResponse && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-700 text-white font-bold">
                  LGA Response
                </span>
              )}
              <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
              {c.editedAt && <span className="text-xs text-slate-300">(edited)</span>}
            </div>

            {editingId === c.id ? (
              <div className="mt-1">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleEdit(c.id)}
                    disabled={editSubmitting}
                    className="px-3 py-1 text-xs bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
                  >
                    {editSubmitting ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
                {isLgaResponse ? c.content.replace("[LGA Response] ", "") : c.content}
              </p>
            )}

            <div className="flex items-center gap-3 mt-1">
              {depth === 0 && (
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === c.id ? null : c.id);
                    setReplyText("");
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-700 transition-colors"
                >
                  <Reply className="h-3 w-3" /> Reply
                </button>
              )}
              {isOwn && (
                <>
                  <button
                    onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </>
              )}
            </div>

            {replyingTo === c.id && depth === 0 && (
              <div className="mt-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isStaff ? "[LGA Response] Write a reply…" : "Write a reply…"}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleReply(c.id)}
                    disabled={replySubmitting || !replyText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
                  >
                    {replySubmitting
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Send className="h-3 w-3" />
                    }
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {c.replies && c.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {c.replies.map((r) => (
              <CommentCard key={r.id} c={r} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-800">
        Comments {total > 0 && <span className="text-slate-400 font-normal">({total})</span>}
      </h3>

      {/* Compose */}
      <div className="flex gap-2.5">
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(""); }}
            onFocus={() => { if (!isLoggedIn) { requireLogin(); (document.activeElement as HTMLElement)?.blur(); } }}
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
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Post
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentCard key={c.id} c={c} />
          ))}
          {page < pages && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 text-xs text-green-700 hover:text-green-800 font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {loadingMore ? "Loading…" : "Load more comments"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
