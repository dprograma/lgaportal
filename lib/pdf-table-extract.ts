import { STATE_COORDS } from "@/lib/nigeria-coordinates";

/**
 * Best-effort table extraction for FAAC-style disbursement PDFs (a report
 * organised as state header rows followed by that state's LGA rows, each
 * ending in a currency amount). There is no fixed schema for these reports —
 * this reconstructs rows from raw glyph positions and is meant to be
 * reviewed/corrected by an admin before import, not trusted blindly.
 */

const STATE_NAMES = new Set(Object.keys(STATE_COORDS).map((s) => s.toUpperCase()));

export interface ExtractedRow {
  name: string;
  state: string | null;
  amount: number;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[₦N,\s]/gi, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 ? n : null;
}

/** Group same-line glyphs (small y differences) then order them left-to-right. */
function linesFromItems(items: TextItem[]): TextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextItem[][] = [];
  const Y_TOLERANCE = 2.5;

  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0].y - item.y) <= Y_TOLERANCE) {
      last.push(item);
    } else {
      lines.push([item]);
    }
  }
  return lines.map((line) => line.sort((a, b) => a.x - b.x));
}

/** Split a line's glyphs into columns wherever there's a wide horizontal gap. */
function columnsFromLine(line: TextItem[]): string[] {
  const GAP_THRESHOLD = 8;
  const columns: string[][] = [[]];

  for (let i = 0; i < line.length; i++) {
    if (i > 0 && line[i].x - line[i - 1].x > GAP_THRESHOLD) {
      columns.push([]);
    }
    columns[columns.length - 1].push(line[i].str);
  }
  return columns.map((c) => c.join("").trim()).filter(Boolean);
}

export async function extractAllocationRows(pdfBuffer: Buffer): Promise<ExtractedRow[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // verbosity: 0 silences pdfjs's internal font-substitution warning — it
  // only affects glyph rendering, which we never do; we only read positioned
  // text (str/transform), so it's irrelevant here.
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer), verbosity: 0 }).promise;

  const rows: ExtractedRow[] = [];
  let currentState: string | null = null;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items: TextItem[] = content.items
      .filter((it): it is typeof it & { str: string; transform: number[] } =>
        "str" in it && typeof it.str === "string" && it.str.trim() !== "" && "transform" in it)
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));

    for (const line of linesFromItems(items)) {
      const columns = columnsFromLine(line);
      if (columns.length === 0) continue;

      const wholeLine = columns.join(" ").trim().toUpperCase();
      if (STATE_NAMES.has(wholeLine) || STATE_NAMES.has(wholeLine.replace(/\s+STATE$/, ""))) {
        currentState = wholeLine.replace(/\s+STATE$/, "");
        continue;
      }

      if (columns.length < 2) continue;
      const amount = parseAmount(columns[columns.length - 1]);
      if (amount === null) continue;

      // Name is everything before the amount column, minus a leading serial number.
      const nameParts = columns.slice(0, -1).filter((c) => !/^\d+$/.test(c));
      const name = nameParts.join(" ").trim();
      if (!name || name.length < 2) continue;

      rows.push({ name, state: currentState, amount });
    }
  }

  return rows;
}
