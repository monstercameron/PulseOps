import { z } from "zod";

import { weeklyBriefRecommendationKindSchema } from "@/features/brief/domain/recommendation-ranking";
import {
  weeklyCashMarginBriefQuestionIds,
  type WeeklyCashMarginBriefQuestionId,
} from "@/features/brief/domain/weekly-cash-margin-brief";
import { citationSchema } from "@/features/trust/domain/citation";

export const weeklyBriefQuestionIdSchema = z.enum(
  weeklyCashMarginBriefQuestionIds,
);

export const weeklyBriefOutputItemSchema = z.object({
  citations: z.array(citationSchema).min(1),
  confidenceScore: z.number().finite().min(0).max(1),
  estimatedValueCents: z.number().int().nonnegative(),
  id: z.string().min(1),
  impactSummary: z.string().min(1),
  priorityScore: z.number().finite(),
  questionId: weeklyBriefQuestionIdSchema,
  recommendationKind: weeklyBriefRecommendationKindSchema,
  title: z.string().min(1),
});

export type WeeklyBriefOutputItem = z.infer<typeof weeklyBriefOutputItemSchema>;

export const weeklyBriefOutputSchema = z.object({
  briefId: z.string().min(1),
  decisionPackId: z.literal("weekly-cash-margin-brief"),
  generatedAt: z.string().datetime(),
  itemCount: z.number().int().nonnegative(),
  items: z.array(weeklyBriefOutputItemSchema),
  orgId: z.string().min(1),
  summary: z.object({
    highConfidenceItemCount: z.number().int().nonnegative(),
    topQuestionIds: z.array(weeklyBriefQuestionIdSchema),
    totalEstimatedValueCents: z.number().int().nonnegative(),
  }),
});

export type WeeklyBriefOutput = z.infer<typeof weeklyBriefOutputSchema>;

type CreateWeeklyBriefOutputInput = {
  briefId: string;
  generatedAt?: string;
  items: WeeklyBriefOutputItem[];
  orgId: string;
};

export function createWeeklyBriefOutput(
  input: CreateWeeklyBriefOutputInput,
): WeeklyBriefOutput {
  const sortedItems = [...input.items]
    .map((item) => weeklyBriefOutputItemSchema.parse(item))
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      return left.id.localeCompare(right.id);
    });

  const totalEstimatedValueCents = sortedItems.reduce(
    (total, item) => total + item.estimatedValueCents,
    0,
  );
  const highConfidenceItemCount = sortedItems.filter(
    (item) => item.confidenceScore >= 0.85,
  ).length;
  const topQuestionIds = Array.from(
    new Set(sortedItems.slice(0, 3).map((item) => item.questionId)),
  );

  return weeklyBriefOutputSchema.parse({
    briefId: input.briefId,
    decisionPackId: "weekly-cash-margin-brief",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    itemCount: sortedItems.length,
    items: sortedItems,
    orgId: input.orgId,
    summary: {
      highConfidenceItemCount,
      topQuestionIds,
      totalEstimatedValueCents,
    },
  });
}

export function getWeeklyBriefQuestionCoverage(
  output: WeeklyBriefOutput,
): WeeklyCashMarginBriefQuestionId[] {
  return Array.from(new Set(output.items.map((item) => item.questionId)));
}
