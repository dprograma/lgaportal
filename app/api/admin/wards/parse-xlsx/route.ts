import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await (file as Blob).arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  // exceljs's own .d.ts declares an ambient `Buffer extends ArrayBuffer`
  // that shadows Node's real Buffer type for this signature, so a real
  // Node Buffer isn't structurally assignable to it. Cast through unknown
  // to the exact parameter type `load()` expects.
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const sheet = workbook.worksheets[0];
  if (!sheet) return NextResponse.json({ error: "No worksheet found." }, { status: 422 });

  const headerRow = sheet.getRow(5);
  const headers: Record<number, string> = {};
  headerRow.eachCell((cell, colNum) => {
    if (cell.value) headers[colNum] = String(cell.value).trim();
  });

  const HEADER_MAP: Record<string, string> = {
    "LGA Name":         "lgaName",
    "State":            "state",
    "Ward Name":        "wardName",
    "Ward Number":      "wardNumber",
    "Councillor Name":  "councillorName",
    "Councillor Email": "councillorEmail",
    "Councillor Phone": "councillorPhone",
    "Population":       "population",
    "Description":      "description",
  };

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

    if (record.lgaName && record.state && record.wardName) {
      rows.push(record);
    }
  });

  return NextResponse.json({ rows, total: rows.length });
}
