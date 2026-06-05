"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PaystackButtonProps {
  amount: number; // in kobo
  email: string;
  purpose: string;
  metadata: Record<string, unknown>;
  label?: string;
  onSuccess?: (ref: string) => void;
  className?: string;
}

export function PaystackButton({
  amount,
  email,
  purpose,
  metadata,
  label = "Pay Now",
  onSuccess,
  className,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email, purpose, metadata }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.authorization_url) {
        toast.error(initData.error ?? "Failed to initialize payment");
        return;
      }

      const { authorization_url, reference } = initData as {
        authorization_url: string;
        reference: string;
      };

      // Open Paystack in a popup
      const popup = window.open(
        authorization_url,
        "paystack",
        "width=600,height=700,top=100,left=200"
      );

      // Poll for completion
      const startTime = Date.now();
      const maxMs = 2 * 60 * 1000; // 2 minutes
      const interval = setInterval(async () => {
        // Stop if popup was closed or timeout
        if (popup?.closed || Date.now() - startTime > maxMs) {
          clearInterval(interval);
          setLoading(false);
          return;
        }

        try {
          const verifyRes = await fetch(
            `/api/paystack/verify?reference=${encodeURIComponent(reference)}`
          );
          const verifyData = await verifyRes.json();

          if (verifyData.status === "SUCCESS") {
            clearInterval(interval);
            popup?.close();
            toast.success("Payment successful!");
            setLoading(false);
            onSuccess?.(reference);
          } else if (verifyData.status === "FAILED") {
            clearInterval(interval);
            popup?.close();
            toast.error("Payment failed. Please try again.");
            setLoading(false);
          }
        } catch {
          // Continue polling on error
        }
      }, 3000);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const defaultClass =
    "flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60 text-white";
  const paystackStyle = !className
    ? { backgroundColor: "#0ba4db" }
    : {};

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? `${defaultClass} hover:opacity-90`}
      style={paystackStyle}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}
