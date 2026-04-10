import { describe, expect, it } from "vitest";

import {
  buildCanonicalEntityId,
  createCanonicalEntity,
  mergeCanonicalEntity,
} from "@/features/entities/domain/canonical-entity";

describe("canonical entity", () => {
  it("builds stable ids and merges aliases without duplication", () => {
    expect(buildCanonicalEntityId("invoice", "Org 123", "INV-001")).toBe(
      "entity_org-123_invoice_inv-001",
    );

    const entity = createCanonicalEntity({
      aliases: ["INV-001", " INV-001 "],
      canonicalKey: "inv-001",
      createdAt: "2026-04-09T20:00:00.000Z",
      displayName: "INV-001",
      entityType: "invoice",
      orgId: "org_123",
      sourceDocumentId: "doc_123",
    });

    expect(
      mergeCanonicalEntity(entity, {
        aliases: ["Invoice 001", "INV-001"],
        sourceDocumentId: "doc_456",
        updatedAt: "2026-04-09T20:05:00.000Z",
      }),
    ).toMatchObject({
      aliases: ["INV-001", "Invoice 001"],
      sourceDocumentIds: ["doc_123", "doc_456"],
      updatedAt: "2026-04-09T20:05:00.000Z",
    });
  });
});
