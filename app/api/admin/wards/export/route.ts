import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const COLS = [
  { key: "lgaName",          header: "LGA Name",            width: 22, desc: "Local Government Area the ward belongs to"          },
  { key: "state",            header: "State",               width: 18, desc: "Nigerian state"                                      },
  { key: "wardName",         header: "Ward Name",           width: 24, desc: "Official name of the ward"                          },
  { key: "wardNumber",       header: "Ward Number",         width: 14, desc: "Numeric ward identifier within the LGA"             },
  { key: "councillorName",   header: "Councillor Name",     width: 25, desc: "Full name of the elected ward councillor"           },
  { key: "councillorEmail",  header: "Councillor Email",    width: 28, desc: "Official email address of the councillor"           },
  { key: "councillorPhone",  header: "Councillor Phone",    width: 18, desc: "Contact phone number for the councillor"            },
  { key: "population",       header: "Population",          width: 14, desc: "Estimated population of the ward"                   },
  { key: "description",      header: "Description",         width: 45, desc: "Brief description or notable information about the ward"},
] as const;

type ColKey = typeof COLS[number]["key"];
type RowData = Record<ColKey, unknown>;

const GREEN  = "15803D";
const WHITE  = "FFFFFF";
const LGREY  = "F0FDF4";
const YELLOW = "FEF9C3";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id    = searchParams.get("id") ?? undefined;
  const lgaId = searchParams.get("lgaId") ?? undefined;
  const state = searchParams.get("state") ?? undefined;

  const wards = await db.ward.findMany({
    where: id    ? { id }
         : lgaId ? { lgaId }
         : state ? { lga: { state: { equals: state, mode: "insensitive" } } }
         : {},
    include: { lga: { select: { lgaName: true, state: true } } },
    orderBy: [{ lga: { state: "asc" } }, { lga: { lgaName: "asc" } }, { wardNumber: "asc" }],
    take: id ? 1 : 5000,
  });

  if (id && wards.length === 0) return NextResponse.json({ error: "Ward not found." }, { status: 404 });

  const rows: RowData[] = wards.map((w) => ({
    lgaName:         w.lga.lgaName,
    state:           w.lga.state,
    wardName:        w.wardName,
    wardNumber:      w.wardNumber,
    councillorName:  w.councillorName,
    councillorEmail: w.councillorEmail,
    councillorPhone: w.councillorPhone,
    population:      w.population,
    description:     w.description,
  }));

  // ── Build workbook ─────────────────────────────────────────────────────────
  const workbook  = new ExcelJS.Workbook();
  workbook.creator = "774ng.com LGA Portal";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Ward Records", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  // ── Row 1: Title banner ────────────────────────────────────────────────────
  sheet.mergeCells(1, 1, 1, COLS.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "🇳🇬  774ng.com — Ward Records Export";
  titleCell.font  = { bold: true, size: 16, color: { argb: WHITE } };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 36;

  // ── Row 2: Metadata banner ─────────────────────────────────────────────────
  sheet.mergeCells(2, 1, 2, COLS.length);
  const metaCell = sheet.getCell("A2");
  const dateStr  = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });
  const scope    = id          ? `Ward: ${rows[0]?.wardName ?? id}`
                 : lgaId && rows.length > 0 ? `LGA: ${rows[0].lgaName}`
                 : state       ? `State: ${state}`
                 : "All Wards";
  metaCell.value = `Exported on ${dateStr}  ·  ${rows.length} ward record${rows.length !== 1 ? "s" : ""}  ·  Scope: ${scope}  ·  Sorted by State → LGA → Ward Number`;
  metaCell.font  = { italic: true, size: 10, color: { argb: "365314" } };
  metaCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 22;

  // ── Row 3: Column descriptions ─────────────────────────────────────────────
  sheet.getRow(3).height = 18;
  COLS.forEach((col, i) => {
    const cell = sheet.getCell(3, i + 1);
    cell.value = col.desc;
    cell.font  = { italic: true, size: 8, color: { argb: "6B7280" } };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "F9FAFB" } };
    cell.alignment = { wrapText: true, vertical: "middle" };
  });

  // ── Row 4: Column headers ──────────────────────────────────────────────────
  sheet.getRow(4).height = 24;
  COLS.forEach((col, i) => {
    const cell = sheet.getCell(4, i + 1);
    cell.value = col.header;
    cell.font  = { bold: true, size: 11, color: { argb: WHITE } };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "166534" } },
      right:  { style: "thin",   color: { argb: "FFFFFF" } },
    };
  });

  // ── Data rows ──────────────────────────────────────────────────────────────
  rows.forEach((row, idx) => {
    const rowNum  = idx + 5;
    const bgColor = idx % 2 === 0 ? "FFFFFF" : LGREY;
    const exRow   = sheet.getRow(rowNum);
    exRow.height  = 20;

    COLS.forEach((col, i) => {
      const cell  = sheet.getCell(rowNum, i + 1);
      const val   = row[col.key];
      cell.value  = val === null || val === undefined ? "" : String(val);
      cell.font   = { size: 10, color: { argb: "111827" } };
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "E5E7EB" } },
        right:  { style: "thin", color: { argb: "E5E7EB" } },
      };
    });
  });

  // ── Column widths, freeze panes, auto-filter ───────────────────────────────
  COLS.forEach((col, i) => { sheet.getColumn(i + 1).width = col.width; });
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 4, topLeftCell: "A5" }];
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLS.length } };

  // ── Serialize ──────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();

  const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const filename = id && rows.length > 0
    ? `ward-${slug(rows[0].wardName as string)}.xlsx`
    : lgaId && rows.length > 0
    ? `wards-${slug(rows[0].lgaName as string)}.xlsx`
    : `ward-records-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buffer as Buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
