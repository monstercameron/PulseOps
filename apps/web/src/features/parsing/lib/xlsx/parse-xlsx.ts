import ExcelJS from "exceljs";

import {
  normalizeTabularSheet,
  type NormalizedTabularSheet,
} from "@/features/parsing/lib/tabular/normalize-tabular-sheet";

export type ParsedWorkbook = {
  sheetCount: number;
  sheets: NormalizedTabularSheet[];
  totalRowCount: number;
};

export async function parseXlsxBuffer(buffer: Buffer): Promise<ParsedWorkbook> {
  if (buffer.byteLength === 0) {
    throw new Error("XLSX buffer is empty.");
  }

  const workbook = new ExcelJS.Workbook();
  const workbookBuffer = buffer as unknown as Parameters<
    typeof workbook.xlsx.load
  >[0];
  await workbook.xlsx.load(workbookBuffer);

  const sheets = workbook.worksheets
    .map((worksheet) => normalizeWorksheet(worksheet))
    .filter((sheet): sheet is NormalizedTabularSheet => sheet !== null);

  if (sheets.length === 0) {
    throw new Error("Workbook does not contain any populated sheets.");
  }

  return {
    sheetCount: sheets.length,
    sheets,
    totalRowCount: sheets.reduce((total, sheet) => total + sheet.rowCount, 0),
  };
}

function normalizeWorksheet(
  worksheet: ExcelJS.Worksheet,
): NormalizedTabularSheet | null {
  const rows = worksheet
    .getSheetValues()
    .slice(1)
    .filter(Array.isArray)
    .map((row) => row.slice(1));

  if (rows.length === 0) {
    return null;
  }

  return normalizeTabularSheet(rows, worksheet.name);
}
