import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdminRequest } from "@/lib/admin-auth";

const HEADER_MAP: Record<string, string> = {
  "LGA Name":  "lgaName",
  "State":     "state",
  "Month":     "month",
  "Year":      "year",
  "Amount ₦":  "amount",
  "Source":    "source",
};

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await (file as Blob).arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return NextResponse.json({ error: "No worksheet found." }, { status: 422 });

  const headerRow = sheet.getRow(5);
  const headers: Record<number, string> = {};
  headerRow.eachCell((cell, colNum) => {
    if (cell.value) headers[colNum] = String(cell.value).trim();
  });

  const rows: Record<string, string>[] = [];

  sheet.eachRow((row, rowNum) => {
    if (rowNum <= 5) return;
    const firstCell = String(row.getCell(1).value ?? "");
    if (firstCell.startsWith("✅")) return;

    const record: Record<string, string> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNum) => {
      const xlsxHeader = headers[colNum];
      const apiKey = HEADER_MAP[xlsxHeader];
      if (apiKey) {
        const val = String(cell.value ?? "").trim();
        if (val) record[apiKey] = val;
      }
    });

    if (record.lgaName && record.state && Number(record.amount) > 0) {
      rows.push(record);
    }
  });

  return NextResponse.json({ rows, total: rows.length });
}
