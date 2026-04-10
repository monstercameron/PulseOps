import { z } from "zod";

export const weeklyBriefRecommendationKindSchema = z.enum([
  "collect-overdue-invoice",
  "review-underpriced-work",
  "require-customer-deposit",
  "adjust-vendor-payment-timing",
  "investigate-margin-leak",
]);

export const weeklyBriefUrgencySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const weeklyBriefRecommendationSchema = z.object({
  id: z.string().min(1),
  kind: weeklyBriefRecommendationKindSchema,
  title: z.string().min(1),
  estimatedValueCents: z.number().int().nonnegative(),
  confidenceScore: z.number().finite().min(0).max(1),
  urgency: weeklyBriefUrgencySchema,
  evidenceCount: z.number().int().nonnegative().default(0),
  daysOpen: z.number().int().nonnegative().default(0),
  isBlocked: z.boolean().default(false),
});

export type WeeklyBriefRecommendation = z.infer<
  typeof weeklyBriefRecommendationSchema
>;

export type RankedWeeklyBriefRecommendation = WeeklyBriefRecommendation & {
  priorityScore: number;
};

const urgencyBonusByLevel = {
  low: 0.1,
  medium: 0.35,
  high: 0.7,
  critical: 1.1,
} as const;

export function calculateRecommendationPriorityScore(
  input: WeeklyBriefRecommendation,
): number {
  const recommendation = weeklyBriefRecommendationSchema.parse(input);
  const urgencyBonus = urgencyBonusByLevel[recommendation.urgency];
  const evidenceBonus = Math.min(recommendation.evidenceCount, 6) * 0.08;
  const blockedPenalty = recommendation.isBlocked ? 0.9 : 0;
  const stalenessPenalty = Math.min(recommendation.daysOpen, 21) * 0.015;
  const valueScore = Math.log10(recommendation.estimatedValueCents + 10_000);
  const confidenceMultiplier = 0.65 + recommendation.confidenceScore * 0.55;
  const priorityScore =
    valueScore * confidenceMultiplier +
    urgencyBonus +
    evidenceBonus -
    blockedPenalty -
    stalenessPenalty;

  return Number(priorityScore.toFixed(4));
}

export function rankWeeklyBriefRecommendations(
  recommendations: WeeklyBriefRecommendation[],
): RankedWeeklyBriefRecommendation[] {
  return recommendations
    .map((recommendation) => {
      const parsedRecommendation =
        weeklyBriefRecommendationSchema.parse(recommendation);

      return {
        ...parsedRecommendation,
        priorityScore:
          calculateRecommendationPriorityScore(parsedRecommendation),
      };
    })
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      if (right.estimatedValueCents !== left.estimatedValueCents) {
        return right.estimatedValueCents - left.estimatedValueCents;
      }

      if (right.confidenceScore !== left.confidenceScore) {
        return right.confidenceScore - left.confidenceScore;
      }

      return left.id.localeCompare(right.id);
    });
}
