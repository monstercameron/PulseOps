import { describe, expect, it } from "vitest";

import {
  enforceCostBudget,
  estimateAiRunCostCents,
} from "@/features/cost/domain/cost-controls";

describe("cost controls", () => {
  it("estimates run cost and enforces budgets", () => {
    const estimatedCost = estimateAiRunCostCents({
      completionTokens: 500,
      embeddingTokens: 300,
      promptTokens: 1000,
    });

    expect(estimatedCost).toBeGreaterThan(0);
    expect(() =>
      enforceCostBudget(estimatedCost, estimatedCost + 1),
    ).not.toThrow();
    expect(() => enforceCostBudget(estimatedCost, 0)).toThrow(
      "Estimated run cost exceeds the configured budget.",
    );
  });
});
