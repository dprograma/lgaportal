import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

// Column definitions: key, header label, width, description
const COLS = [
  { key: "email",          header: "Official Email",      width: 28, desc: "Chairman / official LGA contact email"          },
  { key: "lgaName",        header: "LGA Name",            width: 22, desc: "Full Local Government Area name"                },
  { key: "state",          header: "State",               width: 18, desc: "Nigerian state the LGA belongs to"              },
  { key: "chairmanName",   header: "Chairman Name",       width: 25, desc: "Full name of the sitting LGA chairman"          },
  { key: "phone",          header: "Phone Number",        width: 18, desc: "Official LGA phone number"                      },
  { key: "officeAddress",  header: "Office Address",      width: 35, desc: "Physical address of the LGA secretariat"        },
  { key: "population",     header: "Population",          width: 14, desc: "Estimated population of the LGA"                },
  { key: "description",    header: "LGA Description",     width: 45, desc: "Brief description of the LGA and its highlights"},
  { key: "logoUrl",        header: "Logo URL",            width: 40, desc: "URL to the LGA official logo image"             },
] as const;

type ColKey = typeof COLS[number]["key"];

// Brand colours
const GREEN  = "15803D";
const WHITE  = "FFFFFF";
const LGREY  = "F0FDF4"; // light green tint for alternating rows
const YELLOW = "FEF9C3"; // info banner background

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id     = searchParams.get("id") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const state  = searchParams.get("state")  ?? undefined;

  const where: Record<string, unknown> = {};
  if (id) {
    where.id = id;
  } else {
    if (status && status !== "ALL") where.status = status;
    if (search) where.lgaName = { contains: search, mode: "insensitive" };
    if (state)  where.state   = { contains: state,  mode: "insensitive" };
  }

  const lgas = await db.lGA.findMany({
    where,
    select: { email: true, lgaName: true, state: true, chairmanName: true, phone: true,
               officeAddress: true, population: true, description: true, logoUrl: true },
    orderBy: [{ state: "asc" }, { lgaName: "asc" }],
    take: id ? 1 : 1000,
  });

  if (id && lgas.length === 0) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  // ── Build workbook ─────────────────────────────────────────────────────────
  const workbook  = new ExcelJS.Workbook();
  workbook.creator = "774ng.com LGA Portal";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("LGA Records", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  // ── Row 1: Platform title banner ───────────────────────────────────────────
  sheet.mergeCells(1, 1, 1, COLS.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "🇳🇬  774ng.com LGA Citizen Portal — Official LGA Records";
  titleCell.font  = { bold: true, size: 16, color: { argb: WHITE } };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 40;

  // ── Row 2: Document purpose ────────────────────────────────────────────────
  sheet.mergeCells(2, 1, 2, COLS.length);
  const purposeCell = sheet.getCell("A2");
  purposeCell.value = "PURPOSE: This file contains LGA profile records exported from the 774ng.com platform. It may be used for administrative records, bulk profile updates (re-upload via Admin → LGAs → Bulk Update), or compliance reporting. Do not share publicly.";
  purposeCell.font  = { bold: false, size: 9, color: { argb: "1E3A5F" } };
  purposeCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "DBEAFE" } };
  purposeCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  sheet.getRow(2).height = 32;

  // ── Row 3: Metadata banner ─────────────────────────────────────────────────
  sheet.mergeCells(3, 1, 3, COLS.length);
  const metaCell = sheet.getCell("A3");
  const dateStr  = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });
  metaCell.value = `📅 Exported: ${dateStr}   |   📊 Records: ${lgas.length} LGA${lgas.length !== 1 ? "s" : ""}   |   🔀 Sorted: State → LGA Name   |   🌐 Source: 774ng.com`;
  metaCell.font  = { italic: true, size: 9, color: { argb: "365314" } };
  metaCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 22;

  // ── Row 4: Column description sub-header ───────────────────────────────────
  sheet.getRow(4).height = 18;
  COLS.forEach((col, i) => {
    const cell = sheet.getCell(4, i + 1);
    cell.value = col.desc;
    cell.font  = { italic: true, size: 8, color: { argb: "6B7280" } };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "F9FAFB" } };
    cell.alignment = { wrapText: true, vertical: "middle" };
  });

  // ── Row 5: Column headers ──────────────────────────────────────────────────
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

  // ── Data rows ──────────────────────────────────────────────────────────────
  lgas.forEach((lga, idx) => {
    const rowNum  = idx + 6;
    const isEven  = idx % 2 === 0;
    const bgColor = isEven ? "FFFFFF" : LGREY;
    const row     = sheet.getRow(rowNum);
    row.height    = 20;

    COLS.forEach((col, i) => {
      const cell  = sheet.getCell(rowNum, i + 1);
      const val   = (lga as Record<string, unknown>)[col.key];
      cell.value  = val === null || val === undefined ? "" : String(val);
      cell.font   = { size: 10, color: { argb: "111827" } };
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = { vertical: "middle", wrapText: false };
      cell.border = {
        bottom: { style: "thin", color: { argb: "E5E7EB" } },
        right:  { style: "thin", color: { argb: "E5E7EB" } },
      };
    });
  });

  // ── Column widths ──────────────────────────────────────────────────────────
  COLS.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width;
  });

  // ── Summary row at bottom ─────────────────────────────────────────────────
  const summaryRow = lgas.length + 7;
  sheet.mergeCells(summaryRow, 1, summaryRow, COLS.length);
  const sumCell = sheet.getCell(summaryRow, 1);
  sumCell.value = `✅  End of Export  ·  Total: ${lgas.length} LGA record${lgas.length !== 1 ? "s" : ""}  ·  Generated by 774ng.com  ·  ${new Date().toISOString()}`;
  sumCell.font  = { italic: true, size: 9, color: { argb: "6B7280" } };
  sumCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "F0FDF4" } };
  sumCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(summaryRow).height = 20;

  // ── Freeze panes (header rows) & auto-filter ───────────────────────────────
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 5, topLeftCell: "A6" }];
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: COLS.length } };

  // ── Serialize ──────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();

  const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const filename = id
    ? `lga-${slug(lgas[0].lgaName)}.xlsx`
    : `lga-records-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buffer as Buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
