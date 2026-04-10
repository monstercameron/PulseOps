import { createHash } from "node:crypto";

export interface TextEmbedder {
  readonly dimensions: number;
  readonly modelId: string;
  embedText(text: string): number[];
}

type CreateDeterministicTextEmbedderInput = {
  dimensions?: number;
  modelId?: string;
};

export function createDeterministicTextEmbedder({
  dimensions = 24,
  modelId = "deterministic-text-v1",
}: CreateDeterministicTextEmbedderInput = {}): TextEmbedder {
  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    throw new Error(
      "Deterministic embedder requires a positive dimension count.",
    );
  }

  return {
    dimensions,
    modelId,
    embedText(text) {
      return embedTextDeterministically(text, dimensions);
    },
  };
}

export function cosineSimilarity(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length || left.length === 0) {
    throw new Error(
      "Cosine similarity requires equal non-empty vector lengths.",
    );
  }

  const dotProduct = left.reduce(
    (sum, value, index) => sum + value * (right[index] ?? 0),
    0,
  );

  return Number(dotProduct.toFixed(6));
}

function embedTextDeterministically(
  text: string,
  dimensions: number,
): number[] {
  const tokens = tokenize(text);
  const vector = Array.from({ length: dimensions }, () => 0);

  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();

    for (let index = 0; index < Math.min(6, dimensions); index += 1) {
      const dimensionIndex = digest[index] % dimensions;
      const sign = (digest[index + 8] ?? 0) % 2 === 0 ? 1 : -1;
      const weight = ((digest[index + 16] ?? 0) + 1) / 256;

      vector[dimensionIndex] = (vector[dimensionIndex] ?? 0) + sign * weight;
    }
  }

  return normalizeVector(vector);
}

function tokenize(text: string): string[] {
  const normalizedText = text.trim().toLowerCase();

  if (normalizedText.length === 0) {
    return ["empty"];
  }

  return normalizedText
    .split(/[^a-z0-9._-]+/)
    .filter((token) => token.length > 0);
}

function normalizeVector(vector: readonly number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );

  if (magnitude === 0) {
    return vector.map(() => 0);
  }

  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}
