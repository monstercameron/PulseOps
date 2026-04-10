import { describe, expect, it } from "vitest";

import {
  createExtractionContract,
  summarizeExtractionContract,
} from "@/features/extraction/domain/extraction-contract";
import { createCitation } from "@/features/trust/domain/citation";

describe("extraction contract", () => {
  it("flags low-confidence extractions for review", () => {
    const contract = createExtractionContract({
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      fields: [
        {
          canonicalFactTypeId: "invoice.amount.total",
          citations: [
            createCitation({
              confidenceScore: 0.92,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:1",
            }),
          ],
          confidenceScore: 0.93,
          key: "invoice_total",
          label: "Invoice total",
          value: 4200,
        },
        {
          citations: [
            createCitation({
              confidenceScore: 0.61,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:2",
            }),
          ],
          confidenceScore: 0.61,
          key: "customer_name",
          label: "Customer name",
          value: "Acme Heating",
        },
      ],
    });

    expect(contract.requiresHumanReview).toBe(true);
    expect(summarizeExtractionContract(contract)).toEqual({
      documentFamily: "customer-invoice",
      factBackedFieldCount: 1,
      fieldCount: 2,
      requiresHumanReview: true,
    });
  });
});
