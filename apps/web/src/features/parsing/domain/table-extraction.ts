import { z } from "zod";

import {
  tabularSheetSummarySchema,
  type TabularSheetSummary,
} from "@/features/parsing/domain/parser-artifact";

export const tableCandidateSchema = z.object({
  columnCount: z.number().int().positive(),
  headerCount: z.number().int().positive(),
  name: z.string().min(1),
  rowCount: z.number().int().nonnegative(),
  score: z.number().finite().min(0),
});

export type TableCandidate = z.infer<typeof tableCandidateSchema>;

export const tableExtractionPlanSchema = z.object({
  candidates: z.array(tableCandidateSchema),
  primaryTableName: z.string().min(1).optional(),
});

export type TableExtractionPlan = z.infer<typeof tableExtractionPlanSchema>;

export function buildTableExtractionPlan(
  sheets: readonly TabularSheetSummary[],
): TableExtractionPlan {
  const candidates = sheets
    .map((sheet) => scoreTableCandidate(sheet))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.rowCount !== left.rowCount) {
        return right.rowCount - left.rowCount;
      }

      return left.name.localeCompare(right.name);
    });

  return tableExtractionPlanSchema.parse({
    candidates,
    primaryTableName: candidates[0]?.name,
  });
}

function scoreTableCandidate(sheet: TabularSheetSummary): TableCandidate {
  const parsedSheet = tabularSheetSummarySchema.parse(sheet);
  const rowScore = Math.min(parsedSheet.rowCount, 200) / 200;
  const columnScore = parsedSheet.columnCount >= 2 ? 0.25 : 0;
  const balancedColumnBonus =
    parsedSheet.columnCount >= 3 && parsedSheet.columnCount <= 18 ? 0.18 : 0.04;
  const headerCompletenessBonus =
    parsedSheet.headers.length === parsedSheet.columnCount ? 0.15 : 0;
  const score = Number(
    (
      0.2 +
      rowScore * 0.42 +
      columnScore +
      balancedColumnBonus +
      headerCompletenessBonus
    ).toFixed(4),
  );

  return tableCandidateSchema.parse({
    columnCount: parsedSheet.columnCount,
    headerCount: parsedSheet.headers.length,
    name: parsedSheet.name,
    rowCount: parsedSheet.rowCount,
    score,
  });
}
