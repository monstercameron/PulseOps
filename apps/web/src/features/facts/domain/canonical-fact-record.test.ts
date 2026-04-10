import { describe, expect, it } from "vitest";

import {
  buildCanonicalFactRecordId,
  createCanonicalFactRecord,
} from "@/features/facts/domain/canonical-fact-record";
import { createCitation } from "@/features/trust/domain/citation";

describe("canonical fact record", () => {
  it("creates deterministic fact ids with source citations", () => {
    expect(
      buildCanonicalFactRecordId(
        "doc_123",
        "invoice.amount.total",
        "invoice_total",
      ),
    ).toBe("fact_doc_123_invoice.amount.total_invoice_total");

    const fact = createCanonicalFactRecord({
      canonicalFactTypeId: "invoice.amount.total",
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
      confidenceScore: 0.94,
      createdAt: "2026-04-09T20:30:00.000Z",
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      entityId: "entity_org_123_invoice_inv-001",
      entityType: "invoice",
      orgId: "org_123",
      sourceFieldKey: "invoice_total",
      value: 4200,
    });

    expect(fact).toMatchObject({
      id: "fact_doc_123_invoice.amount.total_invoice_total",
      sourceFieldKey: "invoice_total",
      version: "canonical-fact.v1",
    });
  });
});
