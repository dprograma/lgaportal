"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "verifying" | "success" | "failed";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("verifying");
  const [attempts, setAttempts] = useState(0);

  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    let cancelled = false;
    const maxAttempts = 40; // ~2 minutes at 3s intervals

    const poll = async () => {
      if (cancelled) return;
      try {
        const r = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const data = await r.json();

        if (data.status === "SUCCESS") {
          if (!cancelled) setStatus("success");
          return;
        }

        if (data.status === "FAILED") {
          if (!cancelled) setStatus("failed");
          return;
        }

        // Still pending
        setAttempts((a) => {
          if (a + 1 >= maxAttempts) {
            if (!cancelled) setStatus("failed");
            return a + 1;
          }
          setTimeout(poll, 3000);
          return a + 1;
        });
      } catch {
        setAttempts((a) => {
          if (a + 1 >= maxAttempts) {
            if (!cancelled) setStatus("failed");
            return a + 1;
          }
          setTimeout(poll, 3000);
          return a + 1;
        });
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verifying Payment</h1>
            <p className="text-slate-500 text-sm">
              Please wait while we confirm your payment. This may take a few seconds...
            </p>
            {reference && (
              <p className="mt-3 text-xs font-mono text-slate-400">Ref: {reference}</p>
            )}
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-500 text-sm mb-6">
              Your payment has been confirmed. Your subscription or campaign is now active.
            </p>
            {reference && (
              <p className="text-xs font-mono text-slate-400 mb-6">Ref: {reference}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/lga-dashboard"
                className="bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm"
              >
                Go to LGA Dashboard
              </Link>
              <Link
                href="/advertiser"
                className="bg-slate-100 text-slate-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm"
              >
                Advertiser Dashboard
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-500 text-sm mb-6">
              We could not confirm your payment. If you were charged, please contact support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setStatus("verifying");
                  setAttempts(0);
                }}
                className="bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                className="bg-slate-100 text-slate-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm"
              >
                Go Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
