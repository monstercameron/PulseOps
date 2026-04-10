import { describe, expect, it } from "vitest";

import { buildFactChunkDrafts } from "@/features/chunks/domain/fact-chunking";
import { createCanonicalEntity } from "@/features/entities/domain/canonical-entity";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createCitation } from "@/features/trust/domain/citation";

describe("buildFactChunkDrafts", () => {
  it("groups fact records by entity into retrieval-ready drafts", () => {
    const entity = createCanonicalEntity({
      canonicalKey: "inv-001",
      createdAt: "2026-04-09T22:05:00.000Z",
      displayName: "INV-001",
      entityType: "invoice",
      orgId: "org_123",
      sourceDocumentId: "doc_123",
    });
    const citations = [
      createCitation({
        confidenceScore: 0.94,
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        locator: { row: 2 },
        locatorType: "row",
        sourceHash: "sha256:invoice-total",
      }),
    ];
    const facts = [
      createCanonicalFactRecord({
        canonicalFactTypeId: "invoice.amount.total",
        citations,
        confidenceScore: 0.94,
        createdAt: "2026-04-09T22:05:00.000Z",
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        entityId: entity.id,
        entityType: entity.entityType,
        orgId: "org_123",
        sourceFieldKey: "invoice_total",
        value: 4200,
      }),
      createCanonicalFactRecord({
        canonicalFactTypeId: "invoice.amount.outstanding",
        citations,
        confidenceScore: 0.95,
        createdAt: "2026-04-09T22:05:00.000Z",
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        entityId: entity.id,
        entityType: entity.entityType,
        orgId: "org_123",
        sourceFieldKey: "amount_outstanding",
        value: 2100,
      }),
    ];

    expect(
      buildFactChunkDrafts({
        entities: [entity],
        facts,
      }),
    ).toEqual([
      expect.objectContaining({
        canonicalFactTypeIds: [
          "invoice.amount.outstanding",
          "invoice.amount.total",
        ],
        content:
          "Entity INV-001. invoice amount outstanding: 2100 invoice amount total: 4200",
        entityId: entity.id,
      }),
    ]);
  });
});
