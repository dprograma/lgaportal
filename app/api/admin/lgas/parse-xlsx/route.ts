import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdminRequest } from "@/lib/admin-auth";

// Accepts a multipart/form-data upload with field name "file".
// Parses the XLSX (skipping our 5 header rows) and returns rows as JSON.
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

  // Row 5 (1-indexed) has the column headers; data starts at row 6.
  const headerRow = sheet.getRow(5);
  const headers: Record<number, string> = {};
  headerRow.eachCell((cell, colNum) => {
    if (cell.value) headers[colNum] = String(cell.value).trim();
  });

  const HEADER_MAP: Record<string, string> = {
    "Official Email":  "email",
    "LGA Name":        "lgaName",
    "State":           "state",
    "Chairman Name":   "chairmanName",
    "Phone Number":    "phone",
    "Office Address":  "officeAddress",
    "Population":      "population",
    "LGA Description": "description",
    "Logo URL":        "logoUrl",
  };

  const rows: Record<string, string>[] = [];

  sheet.eachRow((row, rowNum) => {
    if (rowNum <= 5) return; // skip header rows
    // Skip the summary footer row (merged cell with "✅  End of Export")
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

    if (record.email || (record.lgaName && record.state)) {
      rows.push(record);
    }
  });

  return NextResponse.json({ rows, total: rows.length });
}
