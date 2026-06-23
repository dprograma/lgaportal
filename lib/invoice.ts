/**
 * Server-side PDF invoice generation using PDFKit.
 * Returns a Buffer containing the PDF bytes.
 * pdfkit is required dynamically to prevent Turbopack from bundling native Node.js modules.
 */

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  payerName: string;
  payerEmail: string;
  description: string;
  amount: bigint | number; // in kobo
  reference: string;
  purpose: string;
}

const PLATFORM_NAME = "LGA Portal Nigeria";
const PLATFORM_EMAIL = "billing@lgaportal.ng";
const PLATFORM_ADDRESS = "Abuja, Nigeria";

function formatNaira(kobo: bigint | number): string {
  const naira = Number(kobo) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(naira);
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PDFDocument = require("pdfkit") as any;
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const green = "#15803d";
      const dark  = "#1e293b";
      const gray  = "#64748b";
      const light = "#f1f5f9";

      // ── Header ───────────────────────────────────────────────────────────────
      doc.rect(0, 0, 595, 100).fill(green);
      doc
        .fillColor("white")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(PLATFORM_NAME, 50, 30);
      doc
        .fillColor("white")
        .fontSize(10)
        .font("Helvetica")
        .text(PLATFORM_EMAIL, 50, 58)
        .text(PLATFORM_ADDRESS, 50, 72);

      doc
        .fillColor("white")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text("INVOICE", 400, 35, { align: "right" });

      // ── Invoice details ───────────────────────────────────────────────────────
      doc.moveDown(3);
      doc.rect(50, 115, 495, 60).fill(light);

      doc
        .fillColor(dark)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Invoice Number:", 65, 128)
        .font("Helvetica")
        .fillColor(green)
        .text(data.invoiceNumber, 175, 128);

      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .text("Date:", 65, 148)
        .font("Helvetica")
        .fillColor(dark)
        .text(data.date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }), 175, 148);

      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .text("Reference:", 340, 128)
        .font("Helvetica")
        .fillColor(gray)
        .text(data.reference, 415, 128, { width: 120, ellipsis: true });

      // ── Bill To ───────────────────────────────────────────────────────────────
      doc
        .fillColor(dark)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("BILL TO", 50, 200);
      doc
        .moveTo(50, 215).lineTo(545, 215).stroke(green);

      doc
        .fillColor(dark)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(data.payerName, 50, 225)
        .font("Helvetica")
        .fillColor(gray)
        .text(data.payerEmail, 50, 242);

      // ── Items table ───────────────────────────────────────────────────────────
      doc
        .fillColor("white")
        .rect(50, 290, 495, 28)
        .fill(green);

      doc
        .fillColor("white")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Description", 65, 300)
        .text("Amount", 450, 300, { align: "right", width: 80 });

      doc.rect(50, 318, 495, 40).fill("#f8fafc");
      doc
        .fillColor(dark)
        .fontSize(10)
        .font("Helvetica")
        .text(data.description, 65, 330, { width: 350 })
        .text(formatNaira(data.amount), 450, 330, { align: "right", width: 80 });

      // ── Total ─────────────────────────────────────────────────────────────────
      doc
        .moveTo(350, 380).lineTo(545, 380).stroke(green);
      doc
        .fillColor(dark)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("TOTAL", 350, 392)
        .fillColor(green)
        .text(formatNaira(data.amount), 430, 392, { align: "right", width: 110 });

      // ── Footer ────────────────────────────────────────────────────────────────
      doc
        .moveTo(50, 720).lineTo(545, 720).stroke(light);
      doc
        .fillColor(gray)
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Thank you for your business. This is a computer-generated invoice. No signature required.\n${PLATFORM_NAME} · ${PLATFORM_EMAIL}`,
          50, 730,
          { align: "center", width: 495 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
