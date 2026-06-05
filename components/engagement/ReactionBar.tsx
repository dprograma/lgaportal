"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  contentId: string;
  contentType: "post" | "project";
  initialCounts?: Record<string, number>;
}

const REACTIONS = [
  { type: "LIKE",     emoji: "👍", label: "Like"    },
  { type: "DISLIKE",  emoji: "👎", label: "Dislike" },
  { type: "SUPPORT",  emoji: "💪", label: "Support" },
  { type: "QUESTION", emoji: "❓", label: "Question" },
  { type: "REPORT",   emoji: "🚩", label: "Report"  },
];

export default function ReactionBar({ contentId, contentType, initialCounts = {} }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;

  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?contentId=${contentId}&contentType=${contentType}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.counts) setCounts(d.counts);
        if (d.myReaction !== undefined) setMyReaction(d.myReaction);
      })
      .catch(() => null);
  }, [contentId, contentType]);

  async function handleClick(type: string) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prev = { counts: { ...counts }, myReaction };
    const isSame = myReaction === type;
    const newCounts = { ...counts };

    if (isSame) {
      newCounts[type] = Math.max(0, (newCounts[type] ?? 0) - 1);
      setMyReaction(null);
    } else {
      if (myReaction) newCounts[myReaction] = Math.max(0, (newCounts[myReaction] ?? 0) - 1);
      newCounts[type] = (newCounts[type] ?? 0) + 1;
      setMyReaction(type);
    }
    setCounts(newCounts);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, contentType, type }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.counts) setCounts(d.counts);
        if (d.myReaction !== undefined) setMyReaction(d.myReaction);
      } else {
        setCounts(prev.counts);
        setMyReaction(prev.myReaction);
      }
    } catch {
      setCounts(prev.counts);
      setMyReaction(prev.myReaction);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = counts[type] ?? 0;
        const active = myReaction === type;
        return (
          <button
            key={type}
            onClick={() => handleClick(type)}
            disabled={loading}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active
                ? "bg-green-100 border-green-400 text-green-800"
                : "bg-white border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <span>{emoji}</span>
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && <span className="font-bold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
