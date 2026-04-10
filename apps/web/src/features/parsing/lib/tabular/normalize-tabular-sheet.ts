export type TabularRecord = Record<string, string>;

export type NormalizedTabularSheet = {
  columnCount: number;
  headers: string[];
  name: string;
  records: TabularRecord[];
  rowCount: number;
};

export function normalizeTabularHeader(header: string): string {
  return header.trim().replace(/\s+/g, "_").toLowerCase();
}

export function normalizeTabularSheet(
  rows: readonly (readonly unknown[])[],
  name: string,
): NormalizedTabularSheet {
  if (rows.length === 0) {
    throw new Error("Tabular content does not contain a header row.");
  }

  const [headerRow, ...dataRows] = rows;
  const headers = normalizeTabularHeaders(headerRow.map(normalizeCellValue));
  const records = dataRows
    .filter((row) => row.some((cell) => normalizeCellValue(cell).length > 0))
    .map((row, rowIndex) => {
      if (row.length > headers.length) {
        throw new Error(
          `Tabular row ${rowIndex + 2} has ${row.length} columns; expected at most ${headers.length}.`,
        );
      }

      return Object.fromEntries(
        headers.map((header, columnIndex) => [
          header,
          normalizeCellValue(row[columnIndex]),
        ]),
      ) as TabularRecord;
    });

  return {
    columnCount: headers.length,
    headers,
    name,
    records,
    rowCount: records.length,
  };
}

function normalizeTabularHeaders(headers: string[]): string[] {
  const normalizedHeaders = headers.map(normalizeTabularHeader);

  if (normalizedHeaders.some((header) => header.length === 0)) {
    throw new Error("Tabular headers must not be empty.");
  }

  const duplicates = findDuplicateHeaders(normalizedHeaders);

  if (duplicates.length > 0) {
    throw new Error(
      `Tabular headers must be unique after normalization. Duplicates: ${duplicates.join(", ")}`,
    );
  }

  return normalizedHeaders;
}

function findDuplicateHeaders(headers: string[]): string[] {
  const seenHeaders = new Set<string>();
  const duplicateHeaders = new Set<string>();

  for (const header of headers) {
    if (seenHeaders.has(header)) {
      duplicateHeaders.add(header);
      continue;
    }

    seenHeaders.add(header);
  }

  return Array.from(duplicateHeaders);
}

function normalizeCellValue(cell: unknown): string {
  if (cell === null || cell === undefined) {
    return "";
  }

  if (cell instanceof Date) {
    return cell.toISOString();
  }

  return String(cell).trim();
}
