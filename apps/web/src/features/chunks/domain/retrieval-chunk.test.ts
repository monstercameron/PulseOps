import { describe, expect, it } from "vitest";

import {
  buildRetrievalChunkId,
  createRetrievalChunk,
} from "@/features/chunks/domain/retrieval-chunk";
import { createCitation } from "@/features/trust/domain/citation";

describe("retrieval chunk", () => {
  it("creates deterministic chunk ids and embedding metadata", () => {
    expect(
      buildRetrievalChunkId(
        "doc_123",
        "entity_org_123_invoice_inv-001",
        "fact-entity-summary",
      ),
    ).toBe("chunk_doc_123_entity_org_123_invoice_inv-001_fact-entity-summary");

    const chunk = createRetrievalChunk({
      canonicalFactTypeIds: [
        "invoice.amount.outstanding",
        "invoice.amount.total",
      ],
      citations: [
        createCitation({
          confidenceScore: 0.94,
          documentFamily: "customer-invoice",
          documentId: "doc_123",
          locator: { row: 2 },
          locatorType: "row",
          sourceHash: "sha256:invoice-total",
        }),
      ],
      content: "Invoice INV-001 amount total 4200.",
      createdAt: "2026-04-09T22:00:00.000Z",
      documentId: "doc_123",
      embedding: [0.5, -0.5],
      embeddingModel: "deterministic-text-v1",
      entityId: "entity_org_123_invoice_inv-001",
      entityType: "invoice",
      orgId: "org_123",
    });

    expect(chunk.embeddingDimensions).toBe(2);
    expect(chunk.version).toBe("retrieval-chunk.v1");
  });
});
