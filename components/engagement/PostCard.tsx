"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, MessageCircle, MessageSquareMore,
  Flag, ChevronDown, ChevronUp, Calendar,
} from "lucide-react";
import { useSession } from "next-auth/react";
import CommentSection  from "./CommentSection";
import FeedbackModal   from "./FeedbackModal";
import FlagModal       from "./FlagModal";
import LoginPromptModal from "./LoginPromptModal";

export interface PostData {
  id:           string;
  title:        string;
  content:      string;
  imageUrl:     string | null;
  createdAt:    string;
  likes:        number;
  dislikes:     number;
  commentCount: number;
  myReaction:   "LIKE" | "DISLIKE" | null;
}

interface Props {
  post: PostData;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function PostCard({ post }: Props) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Reaction state (optimistic)
  const [likes,      setLikes]      = useState(post.likes);
  const [dislikes,   setDislikes]   = useState(post.dislikes);
  const [myReaction, setMyReaction] = useState<"LIKE" | "DISLIKE" | null>(post.myReaction);
  const [reacting,   setReacting]   = useState(false);

  // UI toggles
  const [showComments,    setShowComments]    = useState(false);
  const [showFeedback,    setShowFeedback]    = useState(false);
  const [showFlag,        setShowFlag]        = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginAction,     setLoginAction]     = useState("");
  const [expanded,        setExpanded]        = useState(false);

  const CONTENT_LIMIT = 300;
  const isLong = post.content.length > CONTENT_LIMIT;

  function requireLogin(action: string) {
    setLoginAction(action);
    setShowLoginPrompt(true);
  }

  async function handleReaction(type: "LIKE" | "DISLIKE") {
    if (!isLoggedIn) { requireLogin("react to posts"); return; }
    if (reacting) return;
    setReacting(true);

    // Optimistic update
    const prev = myReaction;
    if (myReaction === type) {
      // Toggle off
      setMyReaction(null);
      if (type === "LIKE")    setLikes((n) => n - 1);
      if (type === "DISLIKE") setDislikes((n) => n - 1);
    } else {
      if (myReaction === "LIKE")    setLikes((n) => n - 1);
      if (myReaction === "DISLIKE") setDislikes((n) => n - 1);
      setMyReaction(type);
      if (type === "LIKE")    setLikes((n) => n + 1);
      if (type === "DISLIKE") setDislikes((n) => n + 1);
    }

    try {
      const res  = await fetch("/api/reactions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ contentId: post.id, contentType: "post", type }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.counts?.LIKE ?? 0);
        setDislikes(data.counts?.DISLIKE ?? 0);
        setMyReaction(data.myReaction);
      } else {
        // Revert on error
        setMyReaction(prev);
        setLikes(post.likes);
        setDislikes(post.dislikes);
      }
    } catch {
      setMyReaction(prev);
      setLikes(post.likes);
      setDislikes(post.dislikes);
    } finally {
      setReacting(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all duration-200">
        {/* Image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-48 object-cover"
          />
        )}

        <div className="p-5">
          {/* Meta */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Calendar className="h-3 w-3" />
            {formatDate(post.createdAt)}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug mb-2">
            {post.title}
          </h3>

          {/* Content with expand/collapse */}
          <div className="text-sm text-slate-600 leading-relaxed">
            <p className="whitespace-pre-wrap">
              {isLong && !expanded
                ? post.content.slice(0, CONTENT_LIMIT) + "…"
                : post.content}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-green-700 hover:text-green-800 font-medium text-xs mt-1 flex items-center gap-0.5"
              >
                {expanded ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> Read more</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Engagement bar ── */}
        <div className="flex items-center gap-1 px-5 pb-4 flex-wrap">
          {/* Like */}
          <button
            onClick={() => handleReaction("LIKE")}
            disabled={reacting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              myReaction === "LIKE"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-green-300 hover:text-green-700"
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${myReaction === "LIKE" ? "fill-green-600" : ""}`} />
            {likes > 0 && <span>{likes}</span>}
            <span className="hidden sm:inline">Like</span>
          </button>

          {/* Dislike */}
          <button
            onClick={() => handleReaction("DISLIKE")}
            disabled={reacting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              myReaction === "DISLIKE"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-red-300 hover:text-red-600"
            }`}
          >
            <ThumbsDown className={`h-3.5 w-3.5 ${myReaction === "DISLIKE" ? "fill-red-600" : ""}`} />
            {dislikes > 0 && <span>{dislikes}</span>}
            <span className="hidden sm:inline">Dislike</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showComments
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount > 0 && <span>{post.commentCount}</span>}
            <span className="hidden sm:inline">Comment</span>
          </button>

          {/* Feedback */}
          <button
            onClick={() => {
              if (!isLoggedIn) { requireLogin("submit feedback"); return; }
              setShowFeedback(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:border-purple-300 hover:text-purple-600 transition-all"
          >
            <MessageSquareMore className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          {/* Flag */}
          <button
            onClick={() => {
              if (!isLoggedIn) { requireLogin("report content"); return; }
              setShowFlag(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200 hover:border-red-300 hover:text-red-500 transition-all ml-auto"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Report</span>
          </button>
        </div>

        {/* ── Inline comment section ── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <CommentSection
                contentId={post.id}
                contentType="post"
                postId={post.id}
                isLoggedIn={isLoggedIn}
                onLoginRequired={() => requireLogin("comment on posts")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <FeedbackModal
        open={showFeedback}
        postId={post.id}
        onClose={() => setShowFeedback(false)}
      />
      <FlagModal
        open={showFlag}
        postId={post.id}
        onClose={() => setShowFlag(false)}
      />
      <LoginPromptModal
        open={showLoginPrompt}
        action={loginAction}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  );
}
