"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // If already authenticated, skip to admin
  useEffect(() => {
    if (sessionStorage.getItem("adminSecret")) {
      router.replace("/admin");
    }
  }, [router]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Verify password — sets httpOnly session cookie
      const authRes = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!authRes.ok) {
        const d = await authRes.json();
        setError(d.error ?? "Incorrect password.");
        return;
      }

      // 2. Fetch the admin secret now that the cookie is set
      const secretRes = await fetch("/api/admin/auth");
      if (!secretRes.ok) {
        setError("Authentication failed. Please try again.");
        return;
      }

      const { secret } = await secretRes.json();
      sessionStorage.setItem("adminSecret", secret);
      router.replace("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071a0e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-900/40">
            <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-green-400/70 text-sm mt-1">LGA Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-green-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          LGA Portal · Admin Access Only
        </p>
      </div>
    </div>
  );
}
