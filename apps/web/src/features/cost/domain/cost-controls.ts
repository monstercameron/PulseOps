export type EstimatedCostInput = {
  completionTokens: number;
  embeddingTokens: number;
  promptTokens: number;
};

export function estimateAiRunCostCents(input: EstimatedCostInput): number {
  const promptCost = input.promptTokens * 0.0002;
  const completionCost = input.completionTokens * 0.0004;
  const embeddingCost = input.embeddingTokens * 0.00005;

  return Number((promptCost + completionCost + embeddingCost).toFixed(4));
}

export function enforceCostBudget(
  estimatedCostCents: number,
  budgetCents: number,
): void {
  if (estimatedCostCents > budgetCents) {
    throw new Error("Estimated run cost exceeds the configured budget.");
  }
}
