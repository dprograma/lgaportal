"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

interface InvoiceDownloadProps {
  transactionId: string;
  invoiceNumber?: string;
}

export function InvoiceDownload({ transactionId, invoiceNumber }: InvoiceDownloadProps) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const r = await fetch(`/api/invoices/${transactionId}`);
      if (!r.ok) throw new Error("Failed to download invoice");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber ?? transactionId}.pdf`;
      a.target = "_blank";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={loading}
      className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {invoiceNumber ? `Download ${invoiceNumber}` : "Download Invoice"}
    </button>
  );
}
