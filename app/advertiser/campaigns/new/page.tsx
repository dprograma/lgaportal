"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Loader2, ChevronRight, CheckCircle } from "lucide-react";

interface AdPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  durationDays: number;
  formats: string[];
  placements: string[];
  maxImpressions?: number;
}

function formatNaira(kobo: string | number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(kobo) / 100
  );
}

export default function NewCampaignPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-green-600 animate-spin"/></div>}>
      <NewCampaignPage />
    </Suspense>
  );
}

function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [plans, setPlans] = useState<AdPlan[]>([]);
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<AdPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("");
  const [placement, setPlacement] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [creativeUrl, setCreativeUrl] = useState("");

  useEffect(() => {
    fetch("/api/ad-plans")
      .then((r) => r.json())
      .then((data) => {
        if (data.plans) {
          setPlans(data.plans);
          const preselectedId = searchParams.get("planId");
          if (preselectedId) {
            const found = data.plans.find((p: AdPlan) => p.id === preselectedId);
            if (found) {
              setSelectedPlan(found);
              setStep(2);
            }
          }
        }
      })
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoadingPlans(false));
  }, [searchParams]);

  async function handleSubmit() {
    if (!selectedPlan || !title || !format || !placement || !linkUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch("/api/advertiser/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          title,
          description: description || undefined,
          format,
          placement,
          linkUrl,
          creativeUrl: creativeUrl || undefined,
        }),
      });

      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Failed to create campaign");
        return;
      }

      if (data.authorization_url) {
        toast.success("Campaign created! Redirecting to payment...");
        window.open(data.authorization_url, "_blank");
        setTimeout(() => router.push("/advertiser/campaigns"), 2000);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPlans) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Campaign</h1>
        <p className="text-slate-500 text-sm mt-1">Set up your advertising campaign in 3 steps</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: "Choose Plan" },
          { n: 2, label: "Campaign Details" },
          { n: 3, label: "Review & Pay" },
        ].map(({ n, label }, i, arr) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-colors ${
                step > n
                  ? "bg-green-600 text-white"
                  : step === n
                  ? "bg-green-700 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > n ? <CheckCircle className="h-4 w-4" /> : n}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                step === n ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < arr.length - 1 && (
              <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Plan */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Choose a Plan</h2>
          {plans.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No plans available.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setFormat(plan.formats[0] ?? "");
                    setPlacement(plan.placements[0] ?? "");
                    setStep(2);
                  }}
                  className="text-left border-2 border-slate-200 hover:border-green-500 rounded-xl p-5 transition-all hover:shadow-md"
                >
                  <h3 className="font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mt-1 mb-3">{plan.description}</p>
                  <p className="text-2xl font-bold text-green-700">{formatNaira(plan.price)}</p>
                  <p className="text-xs text-slate-400 mb-3">/ {plan.durationDays} days</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.formats.map((f) => (
                      <span
                        key={f}
                        className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Campaign Details */}
      {step === 2 && selectedPlan && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Campaign Details</h2>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-green-600 hover:underline"
            >
              Change plan
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-green-800">
              Selected: {selectedPlan.name} — {formatNaira(selectedPlan.price)} / {selectedPlan.durationDays} days
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Campaign Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Sale 2026"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional: describe your campaign..."
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ad Format <span className="text-red-500">*</span>
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                >
                  {selectedPlan.formats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Placement <span className="text-red-500">*</span>
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                >
                  {selectedPlan.placements.map((p) => (
                    <option key={p} value={p}>
                      {p.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Destination URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://yourbusiness.com"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Creative Image URL
              </label>
              <input
                type="url"
                value={creativeUrl}
                onChange={(e) => setCreativeUrl(e.target.value)}
                placeholder="https://example.com/banner.png (optional)"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Leave blank for text-based sponsored listing
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                if (!title || !format || !placement || !linkUrl) {
                  toast.error("Please fill in all required fields");
                  return;
                }
                setStep(3);
              }}
              className="flex items-center gap-2 bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-800 transition-colors"
            >
              Review Campaign
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Pay */}
      {step === 3 && selectedPlan && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Review & Pay</h2>
            <button
              onClick={() => setStep(2)}
              className="text-sm text-green-600 hover:underline"
            >
              Edit details
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 mb-6">
            <div className="px-5 py-4">
              <h3 className="font-semibold text-slate-800 mb-3">Campaign Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Title</span>
                  <span className="font-medium text-slate-800">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan</span>
                  <span className="font-medium text-slate-800">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Format</span>
                  <span className="font-medium text-slate-800">{format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Placement</span>
                  <span className="font-medium text-slate-800">{placement.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-medium text-slate-800">{selectedPlan.durationDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination URL</span>
                  <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline truncate max-w-[200px]">
                    {linkUrl}
                  </a>
                </div>
                {creativeUrl && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Creative</span>
                    <span className="text-slate-600 truncate max-w-[200px]">{creativeUrl}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-4 bg-green-50">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Total Amount</span>
                <span className="text-2xl font-bold text-green-700">
                  {formatNaira(selectedPlan.price)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your campaign will be submitted for review. Once approved
              and payment is confirmed, it will go live automatically. Review typically takes 24-48
              hours.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-green-700 text-white font-semibold py-3 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating campaign...
              </>
            ) : (
              <>
                Pay {formatNaira(selectedPlan.price)} via Paystack
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
