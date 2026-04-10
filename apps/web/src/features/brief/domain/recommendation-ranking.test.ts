import { describe, expect, it } from "vitest";

import {
  calculateRecommendationPriorityScore,
  rankWeeklyBriefRecommendations,
} from "@/features/brief/domain/recommendation-ranking";

describe("recommendation ranking", () => {
  it("ranks higher-value urgent recommendations first", () => {
    const ranked = rankWeeklyBriefRecommendations([
      {
        confidenceScore: 0.94,
        daysOpen: 1,
        estimatedValueCents: 750_000,
        evidenceCount: 4,
        id: "rec_b",
        isBlocked: false,
        kind: "collect-overdue-invoice",
        title: "Call the three oldest overdue invoices",
        urgency: "critical",
      },
      {
        confidenceScore: 0.81,
        daysOpen: 2,
        estimatedValueCents: 180_000,
        evidenceCount: 2,
        id: "rec_a",
        isBlocked: false,
        kind: "investigate-margin-leak",
        title: "Review labor overages on callback-heavy jobs",
        urgency: "high",
      },
    ]);

    expect(ranked[0]?.id).toBe("rec_b");
    expect(ranked[0]?.priorityScore).toBeGreaterThan(
      ranked[1]?.priorityScore ?? 0,
    );
  });

  it("penalizes blocked recommendations", () => {
    const blockedScore = calculateRecommendationPriorityScore({
      confidenceScore: 0.9,
      daysOpen: 0,
      estimatedValueCents: 400_000,
      evidenceCount: 3,
      id: "blocked",
      isBlocked: true,
      kind: "require-customer-deposit",
      title: "Require a deposit on the next large install",
      urgency: "high",
    });
    const readyScore = calculateRecommendationPriorityScore({
      confidenceScore: 0.9,
      daysOpen: 0,
      estimatedValueCents: 400_000,
      evidenceCount: 3,
      id: "ready",
      isBlocked: false,
      kind: "require-customer-deposit",
      title: "Require a deposit on the next large install",
      urgency: "high",
    });

    expect(readyScore).toBeGreaterThan(blockedScore);
  });

  it("uses deterministic tie-breakers", () => {
    const ranked = rankWeeklyBriefRecommendations([
      {
        confidenceScore: 0.75,
        daysOpen: 2,
        estimatedValueCents: 100_000,
        evidenceCount: 1,
        id: "rec_b",
        isBlocked: false,
        kind: "adjust-vendor-payment-timing",
        title: "Push a vendor payment by two days",
        urgency: "medium",
      },
      {
        confidenceScore: 0.75,
        daysOpen: 2,
        estimatedValueCents: 100_000,
        evidenceCount: 1,
        id: "rec_a",
        isBlocked: false,
        kind: "adjust-vendor-payment-timing",
        title: "Push a vendor payment by two days",
        urgency: "medium",
      },
    ]);

    expect(ranked.map((recommendation) => recommendation.id)).toEqual([
      "rec_a",
      "rec_b",
    ]);
  });
});
