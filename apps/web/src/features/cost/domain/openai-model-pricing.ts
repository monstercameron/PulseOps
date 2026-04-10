export const OPENAI_PRICING_VERSION = "openai-api-pricing-2026-04-09";

export type OpenAiModelPricing = Readonly<{
  cachedInputNanoUsdPerMillionTokens: number;
  inputNanoUsdPerMillionTokens: number;
  modelFamily: string;
  outputNanoUsdPerMillionTokens: number;
  pricingVersion: string;
}>;

type OpenAiUsageCostEstimateInput = Readonly<{
  cachedInputTokens: number;
  inputTokens: number;
  model: string;
  outputTokens: number;
}>;

type OpenAiUsageCostEstimate = Readonly<{
  inputCostNanoUsd: number;
  outputCostNanoUsd: number;
  pricing: OpenAiModelPricing | null;
  totalCostNanoUsd: number;
}>;

const OPENAI_MODEL_PRICING: readonly OpenAiModelPricing[] = [
  {
    cachedInputNanoUsdPerMillionTokens: 75_000_000,
    inputNanoUsdPerMillionTokens: 750_000_000,
    modelFamily: "gpt-5.4-mini",
    outputNanoUsdPerMillionTokens: 4_500_000_000,
    pricingVersion: OPENAI_PRICING_VERSION,
  },
  {
    cachedInputNanoUsdPerMillionTokens: 20_000_000,
    inputNanoUsdPerMillionTokens: 200_000_000,
    modelFamily: "gpt-5.4-nano",
    outputNanoUsdPerMillionTokens: 1_250_000_000,
    pricingVersion: OPENAI_PRICING_VERSION,
  },
  {
    cachedInputNanoUsdPerMillionTokens: 250_000_000,
    inputNanoUsdPerMillionTokens: 2_500_000_000,
    modelFamily: "gpt-5.4",
    outputNanoUsdPerMillionTokens: 15_000_000_000,
    pricingVersion: OPENAI_PRICING_VERSION,
  },
  {
    cachedInputNanoUsdPerMillionTokens: 25_000_000,
    inputNanoUsdPerMillionTokens: 250_000_000,
    modelFamily: "gpt-5-mini",
    outputNanoUsdPerMillionTokens: 2_000_000_000,
    pricingVersion: OPENAI_PRICING_VERSION,
  },
  {
    cachedInputNanoUsdPerMillionTokens: 5_000_000,
    inputNanoUsdPerMillionTokens: 50_000_000,
    modelFamily: "gpt-5-nano",
    outputNanoUsdPerMillionTokens: 400_000_000,
    pricingVersion: OPENAI_PRICING_VERSION,
  },
  {
    cachedInputNanoUsdPerMillionTokens: 125_000_000,
    inputNanoUsdPerMillionTokens: 1_250_000_000,
    modelFamily: "gpt-5",
    outputNanoUsdPerMillionTokens: 10_000_000_000,
    pricingVersion: OPENAI_PRICING_VERSION,
  },
] as const;

const OPENAI_MODEL_PRICING_BY_MATCH_PRIORITY = [...OPENAI_MODEL_PRICING].sort(
  (left, right) => right.modelFamily.length - left.modelFamily.length,
);

export function resolveOpenAiModelPricing(
  model: string,
): OpenAiModelPricing | null {
  const normalizedModel = model.trim().toLowerCase();

  for (const pricing of OPENAI_MODEL_PRICING_BY_MATCH_PRIORITY) {
    if (
      normalizedModel === pricing.modelFamily ||
      normalizedModel.startsWith(`${pricing.modelFamily}-`)
    ) {
      return pricing;
    }
  }

  return null;
}

export function estimateOpenAiUsageCost(
  input: OpenAiUsageCostEstimateInput,
): OpenAiUsageCostEstimate {
  const pricing = resolveOpenAiModelPricing(input.model);

  if (pricing === null) {
    return {
      inputCostNanoUsd: 0,
      outputCostNanoUsd: 0,
      pricing: null,
      totalCostNanoUsd: 0,
    };
  }

  const cachedInputTokens = Math.min(
    Math.max(input.cachedInputTokens, 0),
    input.inputTokens,
  );
  const uncachedInputTokens = Math.max(input.inputTokens - cachedInputTokens, 0);

  const inputCostNanoUsd =
    calculateTokenCostNanoUsd(
      uncachedInputTokens,
      pricing.inputNanoUsdPerMillionTokens,
    ) +
    calculateTokenCostNanoUsd(
      cachedInputTokens,
      pricing.cachedInputNanoUsdPerMillionTokens,
    );
  const outputCostNanoUsd = calculateTokenCostNanoUsd(
    input.outputTokens,
    pricing.outputNanoUsdPerMillionTokens,
  );

  return {
    inputCostNanoUsd,
    outputCostNanoUsd,
    pricing,
    totalCostNanoUsd: inputCostNanoUsd + outputCostNanoUsd,
  };
}

function calculateTokenCostNanoUsd(
  tokenCount: number,
  nanoUsdPerMillionTokens: number,
): number {
  return Math.round((tokenCount * nanoUsdPerMillionTokens) / 1_000_000);
}
