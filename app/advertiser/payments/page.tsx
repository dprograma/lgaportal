"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Download, FileText } from "lucide-react";

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

export default function AdvertiserPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [purposeFilter, setPurposeFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchTransactions = (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ type: "user", page: String(p) });
    if (purposeFilter) params.set("purpose", purposeFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    fetch(`/api/transactions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.transactions) {
          setTransactions(data.transactions);
          setTotalPages(data.pages ?? 1);
        } else {
          toast.error("Failed to load transactions");
        }
      })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
        <p className="text-slate-500 text-sm mt-1">Your transaction records and invoices</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Purpose</label>
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">All</option>
              <option value="AD_CAMPAIGN">Ad Campaign</option>
              <option value="LGA_SUBSCRIPTION">LGA Subscription</option>
              <option value="LGA_RENEWAL">LGA Renewal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={() => { setPage(1); fetchTransactions(1); }}
            className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-green-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No transactions found.
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

          {/* Pagination */}
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
