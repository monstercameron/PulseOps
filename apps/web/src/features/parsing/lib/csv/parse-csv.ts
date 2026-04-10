import { parse } from "csv-parse/sync";

import {
  normalizeTabularHeader,
  normalizeTabularSheet,
  type TabularRecord,
} from "@/features/parsing/lib/tabular/normalize-tabular-sheet";

export type CsvRecord = TabularRecord;

export type ParsedCsv = {
  columnCount: number;
  headers: string[];
  records: CsvRecord[];
  rowCount: number;
};

export function normalizeCsvHeader(header: string): string {
  return normalizeTabularHeader(header);
}

export function parseCsvText(csvText: string): ParsedCsv {
  if (csvText.trim().length === 0) {
    throw new Error("CSV text is empty.");
  }

  const parsedRows = parse(csvText, {
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  if (parsedRows.length === 0) {
    throw new Error("CSV text does not contain a header row.");
  }

  try {
    const normalizedSheet = normalizeTabularSheet(parsedRows, "Sheet1");

    return {
      columnCount: normalizedSheet.columnCount,
      headers: normalizedSheet.headers,
      records: normalizedSheet.records,
      rowCount: normalizedSheet.rowCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CSV parsing failed.";

    throw new Error(message.replaceAll("Tabular", "CSV"));
  }
}
