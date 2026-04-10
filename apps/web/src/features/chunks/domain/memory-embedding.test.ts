import { describe, expect, it } from "vitest";

import { createMemoryEmbedding } from "@/features/chunks/domain/memory-embedding";

describe("memory embedding", () => {
  it("derives vector dimensions from the payload", () => {
    const memoryEmbedding = createMemoryEmbedding({
      content: "Collections risk was accepted by the owner.",
      embedding: [0.11, 0.22, 0.33],
      embeddingModel: "deterministic-embedder.v1",
      id: "memory_123",
      memoryKind: "feedback",
      metadata: {
        recommendationId: "rec_123",
      },
      orgId: "org_123",
      sourceId: "feedback_123",
    });

    expect(memoryEmbedding).toMatchObject({
      embeddingDimensions: 3,
      memoryKind: "feedback",
      version: "memory-embedding.v1",
    });
  });
});
