import { describe, expect, it } from "vitest";

import {
  estimateOpenAiUsageCost,
  resolveOpenAiModelPricing,
} from "@/features/cost/domain/openai-model-pricing";

describe("openai model pricing", () => {
  it("matches snapshot model names to the configured pricing family", () => {
    expect(resolveOpenAiModelPricing("gpt-5-mini-2026-03-01")).toMatchObject({
      modelFamily: "gpt-5-mini",
    });
  });

  it("prices cached and uncached input tokens separately", () => {
    expect(
      estimateOpenAiUsageCost({
        cachedInputTokens: 200,
        inputTokens: 1_000,
        model: "gpt-5-mini",
        outputTokens: 500,
      }),
    ).toMatchObject({
      inputCostNanoUsd: 205_000,
      outputCostNanoUsd: 1_000_000,
      totalCostNanoUsd: 1_205_000,
    });
  });
});
