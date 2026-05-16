"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialLoginButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
}

export default function SocialLoginButtons({
  callbackUrl = "/profile",
  disabled = false,
}: SocialLoginButtonsProps) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);

  const handleGoogle = async () => {
    if (disabled || loadingGoogle || loadingLinkedIn) return;
    setLoadingGoogle(true);
    await signIn("google", { callbackUrl });
  };

  const handleLinkedIn = async () => {
    if (disabled || loadingGoogle || loadingLinkedIn) return;
    setLoadingLinkedIn(true);
    await signIn("linkedin", { callbackUrl });
  };

  const isDisabled = disabled || loadingGoogle || loadingLinkedIn;

  return (
    <div className="flex flex-col gap-3">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={isDisabled}
        className={cn(
          "w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {loadingGoogle ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        )}
        Continue with Google
      </button>

      {/* LinkedIn */}
      <button
        type="button"
        onClick={handleLinkedIn}
        disabled={isDisabled}
        className={cn(
          "w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-[#0077B5] hover:bg-[#006399] text-sm font-medium text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077B5] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {loadingLinkedIn ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        )}
        Continue with LinkedIn
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
    </div>
  );
}
