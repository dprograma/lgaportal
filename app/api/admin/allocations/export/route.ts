import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const COLS = [
  { key: "lgaName", header: "LGA Name",   width: 24, desc: "Full Local Government Area name — must match exactly for re-upload upsert" },
  { key: "state",   header: "State",       width: 18, desc: "Nigerian state (e.g. Lagos, Kano)" },
  { key: "month",   header: "Month",       width: 10, desc: "Month number 1–12 (Jan=1, Dec=12)" },
  { key: "year",    header: "Year",        width: 10, desc: "Four-digit year (e.g. 2025)" },
  { key: "amount",  header: "Amount ₦",   width: 18, desc: "Allocation amount in Naira (decimal, e.g. 50000000.00)" },
  { key: "source",  header: "Source",      width: 38, desc: "Source reference (e.g. FAAC July 2025) — optional" },
  { key: "status",  header: "Published",   width: 12, desc: "READ ONLY — publish status is managed via the admin UI toggle" },
] as const;

type ColKey = typeof COLS[number]["key"];

const GREEN  = "15803D";
const WHITE  = "FFFFFF";
const LGREY  = "F0FDF4";
const YELLOW = "FEF9C3";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") ?? undefined;
  const year  = searchParams.get("year")  ? Number(searchParams.get("year"))  : undefined;
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  const where: Record<string, unknown> = {};
  if (state) where.state = { equals: state, mode: "insensitive" };
  if (year)  where.year  = year;
  if (month) where.month = month;

  const records = await db.allocationRecord.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }, { state: "asc" }, { lgaName: "asc" }],
    take: 10000,
  });

  // ── Build workbook ──────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "774ng.com LGA Portal";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Allocation Records", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  // Row 1: title
  sheet.mergeCells(1, 1, 1, COLS.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "🇳🇬  774ng.com LGA Citizen Portal — FAAC Allocation Records";
  titleCell.font  = { bold: true, size: 16, color: { argb: WHITE } };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 40;

  // Row 2: purpose
  sheet.mergeCells(2, 1, 2, COLS.length);
  const purposeCell = sheet.getCell("A2");
  purposeCell.value = "PURPOSE: This file contains FAAC allocation records exported from the 774ng.com platform. Edit the LGA Name, State, Month, Year, Amount ₦, and Source columns, then re-upload via Admin → Allocations → Import XLSX to bulk-update records. The Published column is read-only — use the admin UI toggle to publish/unpublish. Do not share publicly.";
  purposeCell.font  = { bold: false, size: 9, color: { argb: "1E3A5F" } };
  purposeCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "DBEAFE" } };
  purposeCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  sheet.getRow(2).height = 36;

  // Row 3: metadata
  sheet.mergeCells(3, 1, 3, COLS.length);
  const metaCell = sheet.getCell("A3");
  const dateStr  = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });
  const filterDesc = [
    state ? `State: ${state}` : "",
    year  ? `Year: ${year}`   : "",
    month ? `Month: ${month}` : "",
  ].filter(Boolean).join("  |  ") || "All records";
  metaCell.value = `📅 Exported: ${dateStr}   |   📊 Records: ${records.length}   |   🔍 Filter: ${filterDesc}   |   🌐 Source: 774ng.com`;
  metaCell.font  = { italic: true, size: 9, color: { argb: "365314" } };
  metaCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 22;

  // Row 4: column descriptions
  sheet.getRow(4).height = 18;
  COLS.forEach((col, i) => {
    const cell = sheet.getCell(4, i + 1);
    cell.value = col.desc;
    cell.font  = { italic: true, size: 8, color: { argb: "6B7280" } };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "F9FAFB" } };
    cell.alignment = { wrapText: true, vertical: "middle" };
  });

  // Row 5: column headers
  sheet.getRow(5).height = 26;
  COLS.forEach((col, i) => {
    const cell = sheet.getCell(5, i + 1);
    cell.value = col.header;
    cell.font  = { bold: true, size: 11, color: { argb: WHITE } };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top:    { style: "medium", color: { argb: "166534" } },
      bottom: { style: "medium", color: { argb: "166534" } },
      right:  { style: "thin",   color: { argb: "FFFFFF" } },
    };
  });

  // Data rows
  records.forEach((r, idx) => {
    const rowNum  = idx + 6;
    const isEven  = idx % 2 === 0;
    const bgColor = isEven ? "FFFFFF" : LGREY;
    const row     = sheet.getRow(rowNum);
    row.height    = 20;

    const values: Record<ColKey, unknown> = {
      lgaName: r.lgaName,
      state:   r.state,
      month:   r.month,
      year:    r.year,
      amount:  Number(r.amount) / 100,
      source:  r.source ?? "",
      status:  r.isPublished ? "Published" : "Draft",
    };

    COLS.forEach((col, i) => {
      const cell = sheet.getCell(rowNum, i + 1);
      cell.value = values[col.key] ?? "";
      cell.font  = { size: 10, color: { argb: "111827" } };
      cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "E5E7EB" } },
        right:  { style: "thin", color: { argb: "E5E7EB" } },
      };
      // Right-align numeric cells
      if (col.key === "amount" || col.key === "month" || col.key === "year") {
        cell.alignment = { vertical: "middle", horizontal: "right" };
      }
      // Gray out the read-only Published column
      if (col.key === "status") {
        cell.font = { size: 10, color: { argb: "9CA3AF" }, italic: true };
      }
    });
  });

  // Column widths
  COLS.forEach((col, i) => { sheet.getColumn(i + 1).width = col.width; });

  // Summary row
  const summaryRow = records.length + 7;
  sheet.mergeCells(summaryRow, 1, summaryRow, COLS.length);
  const sumCell = sheet.getCell(summaryRow, 1);
  sumCell.value = `✅  End of Export  ·  Total: ${records.length} allocation record${records.length !== 1 ? "s" : ""}  ·  Generated by 774ng.com  ·  ${new Date().toISOString()}`;
  sumCell.font  = { italic: true, size: 9, color: { argb: "6B7280" } };
  sumCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "F0FDF4" } };
  sumCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(summaryRow).height = 20;

  // Freeze panes & auto-filter
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 5, topLeftCell: "A6" }];
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: COLS.length } };

  const buffer = await workbook.xlsx.writeBuffer();

  const parts = ["allocations", state, year, month].filter(Boolean).join("-");
  const filename = `${parts || "allocations"}-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
