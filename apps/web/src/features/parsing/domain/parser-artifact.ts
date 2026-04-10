import { z } from "zod";

export const parserKindSchema = z.enum(["csv", "xlsx"]);

export type ParserKind = z.infer<typeof parserKindSchema>;

export const tabularSheetSummarySchema = z.object({
  columnCount: z.number().int().positive(),
  headers: z.array(z.string().min(1)).min(1),
  name: z.string().min(1),
  rowCount: z.number().int().nonnegative(),
});

export type TabularSheetSummary = z.infer<typeof tabularSheetSummarySchema>;

export const parserArtifactSchema = z.object({
  confidenceScore: z.number().finite().min(0).max(1),
  createdAt: z.string().datetime(),
  documentId: z.string().min(1),
  id: z.string().min(1),
  parserKind: parserKindSchema,
  sheetCount: z.number().int().positive(),
  sheets: z.array(tabularSheetSummarySchema).min(1),
  totalRowCount: z.number().int().nonnegative(),
});

export type ParserArtifact = z.infer<typeof parserArtifactSchema>;

type CreateParserArtifactInput = {
  createdAt?: string;
  documentId: string;
  id: string;
  parserKind: ParserKind;
  sheets: TabularSheetSummary[];
};

export function createParserArtifact(
  input: CreateParserArtifactInput,
): ParserArtifact {
  const totalRowCount = input.sheets.reduce(
    (rowCount, sheet) => rowCount + sheet.rowCount,
    0,
  );

  return parserArtifactSchema.parse({
    confidenceScore: calculateTabularParserConfidence(input.sheets),
    createdAt: input.createdAt ?? new Date().toISOString(),
    documentId: input.documentId,
    id: input.id,
    parserKind: input.parserKind,
    sheetCount: input.sheets.length,
    sheets: input.sheets,
    totalRowCount,
  });
}

export function calculateTabularParserConfidence(
  sheets: readonly TabularSheetSummary[],
): number {
  if (sheets.length === 0) {
    throw new Error("Parser confidence requires at least one sheet summary.");
  }

  const totalRows = sheets.reduce(
    (rowCount, sheet) => rowCount + sheet.rowCount,
    0,
  );
  const averageColumnCount =
    sheets.reduce((columnCount, sheet) => columnCount + sheet.columnCount, 0) /
    sheets.length;

  let confidenceScore = 0.58;

  if (totalRows > 0) {
    confidenceScore += 0.16;
  }

  if (averageColumnCount >= 2) {
    confidenceScore += 0.12;
  }

  if (averageColumnCount <= 40) {
    confidenceScore += 0.06;
  }

  if (sheets.every((sheet) => sheet.headers.length === sheet.columnCount)) {
    confidenceScore += 0.06;
  }

  return Number(Math.min(confidenceScore, 0.98).toFixed(2));
}
