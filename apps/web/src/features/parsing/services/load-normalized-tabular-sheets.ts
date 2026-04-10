import { parseCsvText } from "@/features/parsing/lib/csv/parse-csv";
import { parseXlsxBuffer } from "@/features/parsing/lib/xlsx/parse-xlsx";
import { type NormalizedTabularSheet } from "@/features/parsing/lib/tabular/normalize-tabular-sheet";

export async function loadNormalizedTabularSheets(
  fileName: string,
  body: Buffer,
): Promise<NormalizedTabularSheet[]> {
  const normalizedExtension = fileName.split(".").pop()?.trim().toLowerCase();

  if (normalizedExtension === "csv") {
    const parsedCsv = parseCsvText(body.toString("utf8"));

    return [
      {
        columnCount: parsedCsv.columnCount,
        headers: parsedCsv.headers,
        name: "Sheet1",
        records: parsedCsv.records,
        rowCount: parsedCsv.rowCount,
      },
    ];
  }

  if (normalizedExtension === "xlsx") {
    const parsedWorkbook = await parseXlsxBuffer(body);

    return parsedWorkbook.sheets;
  }

  throw new Error(
    `Normalized tabular sheet loading does not support ${normalizedExtension ?? "unknown"} files.`,
  );
}
