import { describe, expect, it } from "vitest";

import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { buildLowConfidenceReview } from "@/features/extraction/domain/low-confidence-review";
import { createParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { createCitation } from "@/features/trust/domain/citation";

describe("low confidence review", () => {
  it("builds review records when parser, classification, or fields are weak", () => {
    const extractionContract = createExtractionContract({
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      fields: [
        {
          citations: [
            createCitation({
              confidenceScore: 0.62,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:field-1",
            }),
          ],
          confidenceScore: 0.62,
          key: "customer_name",
          label: "Customer name",
          value: "Acme Heating",
        },
      ],
    });
    const parserArtifact = createParserArtifact({
      createdAt: "2026-04-09T16:00:00.000Z",
      documentId: "doc_123",
      id: "artifact_123",
      parserKind: "csv",
      sheets: [
        {
          columnCount: 4,
          headers: [
            "invoice_number",
            "customer_name",
            "due_date",
            "amount_due",
          ],
          name: "Sheet1",
          rowCount: 8,
        },
      ],
    });

    const review = buildLowConfidenceReview({
      classificationConfidenceScore: 0.64,
      extractionContract,
      parserArtifact: {
        ...parserArtifact,
        confidenceScore: 0.71,
      },
    });

    expect(review).toMatchObject({
      classificationConfidenceScore: 0.64,
      documentId: "doc_123",
      fieldKeysNeedingReview: ["customer_name"],
      parserConfidenceScore: 0.71,
      reviewSeverity: "high",
    });
    expect(review?.reasonCodes).toEqual(
      expect.arrayContaining([
        "low_parser_confidence",
        "low_classification_confidence",
        "low_field_confidence",
        "missing_fact_backed_fields",
      ]),
    );
  });

  it("returns null when the extraction is strong enough", () => {
    const extractionContract = createExtractionContract({
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      fields: [
        {
          canonicalFactTypeId: "invoice.amount.total",
          citations: [
            createCitation({
              confidenceScore: 0.93,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:field-2",
            }),
          ],
          confidenceScore: 0.93,
          key: "invoice_total",
          label: "Invoice total",
          value: 4200,
        },
      ],
    });
    const parserArtifact = createParserArtifact({
      documentId: "doc_123",
      id: "artifact_123",
      parserKind: "csv",
      sheets: [
        {
          columnCount: 4,
          headers: [
            "invoice_number",
            "customer_name",
            "due_date",
            "amount_due",
          ],
          name: "Sheet1",
          rowCount: 8,
        },
      ],
    });

    expect(
      buildLowConfidenceReview({
        classificationConfidenceScore: 0.9,
        extractionContract,
        parserArtifact,
      }),
    ).toBeNull();
  });
});
