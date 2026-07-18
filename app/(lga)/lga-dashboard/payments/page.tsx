"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Download, FileText, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Transaction {
  id: string;
  invoiceNumber?: string;
  createdAt: string;
  paidAt?: string;
  purpose: string;
  amount: string;
  status: string;
  paystackRef?: string;
}

const statusColors: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
  REVERSED: "bg-slate-100 text-slate-500",
};

const purposeLabels: Record<string, string> = {
  AD_CAMPAIGN: "Ad Campaign",
  LGA_SUBSCRIPTION: "LGA Subscription",
  LGA_RENEWAL: "LGA Renewal",
};

function formatNaira(kobo: string | number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(kobo) / 100
  );
}

export default function LGAPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Subscription info — the lgaId is stashed in sessionStorage at OTP login,
  // the same way every other LGA dashboard page reads it (there is no
  // /api/lga/me endpoint).
  const lgaId = typeof window !== "undefined" ? sessionStorage.getItem("lgaId") : null;

  useEffect(() => {
    if (!lgaId) return;
    fetchTransactions(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lgaId, page]);

  function fetchTransactions(p: number) {
    setLoading(true);
    const params = new URLSearchParams({ type: "lga", lgaId: lgaId!, page: String(p) });
    fetch(`/api/transactions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.transactions) {
          setTransactions(data.transactions);
          setTotalPages(data.pages ?? 1);
        } else {
          toast.error("Failed to load payment history");
        }
      })
      .catch(() => toast.error("Failed to load payment history"))
      .finally(() => setLoading(false));
  }

  async function downloadInvoice(txId: string, invoiceNumber?: string) {
    setDownloading(txId);
    try {
      const r = await fetch(`/api/invoices/${txId}`);
      if (!r.ok) throw new Error("Failed to download invoice");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber ?? txId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloading(null);
    }
  }

  function handleRenew() {
    // TODO: wire up to POST /api/paystack/initialize once LGA subscription
    // pricing is configured. Previously this pointed at a
    // /lga-dashboard/subscription route that was never built, so every click
    // 404'd.
    toast.error("Subscription payments aren't available yet. Please contact support.");
  }

  const latestSuccessful = transactions.find((t) => t.status === "SUCCESS");
  const isSubscriptionActive = !!latestSuccessful;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments & Billing</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your subscription and payment history</p>
        </div>
        <button
          onClick={handleRenew}
          className="flex items-center gap-2 bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Renew Subscription
        </button>
      </div>

      {/* Subscription Status Card */}
      <div
        className={`rounded-xl border p-5 mb-8 ${
          isSubscriptionActive
            ? "bg-green-50 border-green-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <div className="flex items-start gap-3">
          {isSubscriptionActive ? (
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`font-semibold ${
                isSubscriptionActive ? "text-green-800" : "text-orange-800"
              }`}
            >
              {isSubscriptionActive ? "Subscription Active" : "No Active Subscription"}
            </p>
            <p
              className={`text-sm mt-0.5 ${
                isSubscriptionActive ? "text-green-700" : "text-orange-700"
              }`}
            >
              {isSubscriptionActive
                ? `Last payment: ${formatNaira(latestSuccessful!.amount)} on ${new Date(latestSuccessful!.paidAt ?? latestSuccessful!.createdAt).toLocaleDateString("en-NG")}`
                : "Renew your subscription to continue using LGA Portal features."}
            </p>
          </div>
        </div>
        {!isSubscriptionActive && (
          <div className="mt-4">
            <button
              onClick={handleRenew}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Clock className="h-4 w-4" />
              Renew Now
            </button>
          </div>
        )}
      </div>

      {/* Payment History */}
      <h2 className="font-semibold text-slate-800 mb-4">Payment History</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No payment records found.
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Description</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">
                        {t.invoiceNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString("en-NG")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {purposeLabels[t.purpose] ?? t.purpose}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {formatNaira(t.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[t.status] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.status === "SUCCESS" && (
                          <button
                            onClick={() => downloadInvoice(t.id, t.invoiceNumber)}
                            disabled={downloading === t.id}
                            className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
                          >
                            {downloading === t.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
