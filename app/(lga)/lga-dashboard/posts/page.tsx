"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2,
  FileText, Eye, Archive, ThumbsUp, MessageCircle, Loader2,
  Image as ImageIcon, Send, Star, UserCircle2,
} from "lucide-react";

const schema = z.object({
  title:    z.string().min(3, "Title must be at least 3 characters").max(120),
  content:  z.string().min(10, "Content must be at least 10 characters"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status:   z.enum(["DRAFT", "PUBLISHED"]),
});
type FormValues = z.infer<typeof schema>;

interface Post {
  id:           string;
  title:        string;
  content:      string;
  imageUrl:     string | null;
  status:       "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt:    string;
  likes:        number;
  dislikes:     number;
  commentCount: number;
}

interface CommentReply {
  id:        string;
  content:   string;
  createdAt: string;
  user:      { name: string; image: string | null };
}

interface CommentItem extends CommentReply {
  replies: CommentReply[];
}

interface FeedbackItem {
  id:        string;
  rating:    number;
  category:  string;
  message:   string;
  createdAt: string;
  user:      { name: string; image: string | null };
}

export default function PostsPage() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleting,setDeleting]= useState<string | null>(null);
  const [toast,   setToast]   = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [lgaId,   setLgaId]   = useState("");

  // Engagement modal — read-only view of citizen comments + feedback on a post.
  const [viewing,          setViewing]          = useState<Post | null>(null);
  const [engagementTab,    setEngagementTab]    = useState<"comments" | "feedback">("comments");
  const [comments,         setComments]         = useState<CommentItem[]>([]);
  const [feedback,         setFeedback]         = useState<FeedbackItem[]>([]);
  const [engagementLoading,setEngagementLoading]= useState(false);

  useEffect(() => {
    // lgaId is written to sessionStorage at OTP verification (see verify-otp/page.tsx) —
    // this page previously read from localStorage, which is never written anywhere,
    // so fetchPosts always early-returned and the list/spinner never resolved.
    const id = sessionStorage.getItem("lgaId") ?? "";
    setLgaId(id);
  }, []);

  const {
    register, handleSubmit, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: "", imageUrl: "", status: "PUBLISHED" },
  });

  const fetchPosts = useCallback(async () => {
    if (!lgaId) {
      // Nothing to fetch yet — but don't leave the spinner running forever if
      // the session id genuinely never resolves (e.g. sessionStorage cleared).
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`/api/posts?lgaId=${lgaId}&limit=50`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
    } catch {
      showToast("error", "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [lgaId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  function openCreate() {
    reset({ title: "", content: "", imageUrl: "", status: "PUBLISHED" });
    setEditing(null);
    setModal("create");
  }

  function openEdit(post: Post) {
    reset({
      title:    post.title,
      content:  post.content,
      imageUrl: post.imageUrl ?? "",
      status:   post.status === "ARCHIVED" ? "PUBLISHED" : post.status,
    });
    setEditing(post);
    setModal("edit");
  }

  async function openEngagement(post: Post) {
    setViewing(post);
    setEngagementTab("comments");
    setEngagementLoading(true);
    try {
      const [commentsRes, feedbackRes] = await Promise.all([
        fetch(`/api/comments?contentId=${post.id}&contentType=post`),
        fetch(`/api/lga-dashboard/feedback?postId=${post.id}`),
      ]);
      const commentsData = await commentsRes.json();
      const feedbackData = await feedbackRes.json();
      setComments(commentsData.comments ?? []);
      setFeedback(feedbackData.feedback ?? []);
    } catch {
      showToast("error", "Failed to load engagement.");
    } finally {
      setEngagementLoading(false);
    }
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

  async function onSubmit(data: FormValues) {
    try {
      if (modal === "create") {
        const res  = await fetch("/api/posts", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ ...data, lgaId }),
        });
        const json = await res.json();
        if (!res.ok) { showToast("error", json.error ?? "Failed to create post."); return; }
        showToast("success", "Post published successfully.");
      } else if (editing) {
        const res  = await fetch(`/api/posts/${editing.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) { showToast("error", json.error ?? "Failed to update post."); return; }
        showToast("success", "Post updated.");
      }
      setModal(null);
      fetchPosts();
    } catch {
      showToast("error", "Network error. Please try again.");
    }
  }

  async function handleArchive(post: Post) {
    try {
      await fetch(`/api/posts/${post.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: post.status === "ARCHIVED" ? "PUBLISHED" : "ARCHIVED" }),
      });
      fetchPosts();
      showToast("success", post.status === "ARCHIVED" ? "Post republished." : "Post archived.");
    } catch {
      showToast("error", "Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
      setPosts((p) => p.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
      showToast("success", "Post deleted.");
    } catch {
      showToast("error", "Failed to delete post.");
    } finally {
      setDeleting(null);
    }
  }

  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const drafts    = posts.filter((p) => p.status === "DRAFT").length;
  const archived  = posts.filter((p) => p.status === "ARCHIVED").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-700 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertCircle className="h-4 w-4" />
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Posts & Updates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Publish announcements and project updates citizens can engage with
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Post
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",     value: total,     icon: FileText, color: "slate"  },
          { label: "Published", value: published,  icon: Eye,      color: "green"  },
          { label: "Draft",     value: drafts,     icon: Send,     color: "yellow" },
          { label: "Archived",  value: archived,   icon: Archive,  color: "slate"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${
              color === "green"  ? "bg-green-100 text-green-700"  :
              color === "yellow" ? "bg-yellow-100 text-yellow-700":
              "bg-slate-100 text-slate-500"
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium mb-1">No posts yet</p>
          <p className="text-sm text-slate-400 mb-4">Create your first post to start engaging citizens</p>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
          >
            Create Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                post.status === "ARCHIVED" ? "border-slate-100 opacity-60" : "border-slate-200"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        post.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                        post.status === "DRAFT"     ? "bg-yellow-100 text-yellow-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1 truncate">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEdit(post)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(post)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      title={post.status === "ARCHIVED" ? "Republish" : "Archive"}
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting === post.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>

                {/* Engagement stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <ThumbsUp className="h-3 w-3" /> {post.likes}
                  </span>
                  <button
                    onClick={() => openEngagement(post)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-700 transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" /> {post.commentCount}
                    {post.commentCount > 0 && <span className="underline">view</span>}
                  </button>
                  {post.imageUrl && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <ImageIcon className="h-3 w-3" /> Image attached
                    </span>
                  )}
                  <button
                    onClick={() => openEngagement(post)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-700 transition-colors ml-auto"
                  >
                    <Star className="h-3 w-3" /> Feedback
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">
                    {modal === "create" ? "New Post" : "Edit Post"}
                  </h2>
                  <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("title")}
                        placeholder="Post title…"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all ${
                          errors.title
                            ? "border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-green-500 focus:ring-green-100"
                        }`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{errors.title.message}
                        </p>
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register("content")}
                        rows={6}
                        placeholder="Write your post content here…"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 resize-none transition-all ${
                          errors.content
                            ? "border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-green-500 focus:ring-green-100"
                        }`}
                      />
                      {errors.content && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{errors.content.message}
                        </p>
                      )}
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Image URL <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        {...register("imageUrl")}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
                      />
                      {errors.imageUrl && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{errors.imageUrl.message}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Publish Status
                      </label>
                      <div className="flex gap-2">
                        {(["PUBLISHED", "DRAFT"] as const).map((s) => (
                          <label
                            key={s}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                              s === "PUBLISHED"
                                ? "border-green-300 text-green-700 bg-green-50"
                                : "border-yellow-300 text-yellow-700 bg-yellow-50"
                            }`}
                          >
                            <input type="radio" value={s} {...register("status")} className="sr-only" />
                            {s === "PUBLISHED" ? <Eye className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      {isSubmitting
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : modal === "create" ? "Publish Post" : "Save Changes"
                      }
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Engagement Modal (comments + feedback, read-only) ── */}
      <AnimatePresence>
        {viewing && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setViewing(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 truncate pr-4">{viewing.title}</h2>
                    <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                  {/* Tabs */}
                  <div className="flex gap-1 mt-3">
                    <button
                      onClick={() => setEngagementTab("comments")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        engagementTab === "comments" ? "bg-green-100 text-green-700" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Comments ({comments.length})
                    </button>
                    <button
                      onClick={() => setEngagementTab("feedback")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        engagementTab === "feedback" ? "bg-green-100 text-green-700" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Feedback ({feedback.length})
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 overflow-y-auto flex-1">
                  {engagementLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    </div>
                  ) : engagementTab === "comments" ? (
                    comments.length === 0 ? (
                      <div className="text-center py-16">
                        <MessageCircle className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No comments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((c) => (
                          <div key={c.id}>
                            <div className="flex gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {c.user.image
                                  ? // eslint-disable-next-line @next/next/no-img-element
                                    <img src={c.user.image} alt="" className="h-full w-full object-cover" />
                                  : <UserCircle2 className="h-5 w-5 text-slate-400" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-sm font-semibold text-slate-800">{c.user.name}</span>
                                  <span className="text-[11px] text-slate-400">{timeAgo(c.createdAt)}</span>
                                </div>
                                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                            {c.replies?.length > 0 && (
                              <div className="ml-10 mt-2 space-y-2 border-l-2 border-slate-100 pl-3">
                                {c.replies.map((r) => (
                                  <div key={r.id} className="flex gap-2">
                                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                      {r.user.image
                                        ? // eslint-disable-next-line @next/next/no-img-element
                                          <img src={r.user.image} alt="" className="h-full w-full object-cover" />
                                        : <UserCircle2 className="h-4 w-4 text-slate-400" />
                                      }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-semibold text-slate-800">{r.user.name}</span>
                                        <span className="text-[10px] text-slate-400">{timeAgo(r.createdAt)}</span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{r.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  ) : feedback.length === 0 ? (
                    <div className="text-center py-16">
                      <Star className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No feedback yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedback.map((f) => (
                        <div key={f.id} className="p-3 rounded-xl bg-slate-50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-800">{f.user.name}</span>
                            <span className="text-[11px] text-slate-400">{timeAgo(f.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  className={`h-3.5 w-3.5 ${n <= f.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-slate-500">{f.category}</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{f.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
