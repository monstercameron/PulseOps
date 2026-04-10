import { describe, expect, it } from "vitest";

import {
  buildGenericDocumentExtractionPrompt,
  getGenericDocumentExtractionInstructions,
  materializeGenericDocumentExtractionContract,
} from "@/features/extraction/domain/generic-document-extraction";

describe("generic document extraction", () => {
  it("builds a tabular prompt with supported family context", () => {
    const prompt = buildGenericDocumentExtractionPrompt({
      documentFamilyHint: "customer-invoice",
      fileName: "ledger.csv",
      parserRoute: "tabular",
      tabularPreview: "Sheet: Sheet1\nRow 2: account=Sales | amount=4200",
    });

    expect(prompt).toContain("File name: ledger.csv");
    expect(prompt).toContain("Prior family hint: customer-invoice.");
    expect(prompt).toContain("generic-business-document");
    expect(getGenericDocumentExtractionInstructions()).toContain(
      "structured observations",
    );
  });

  it("materializes generic observations into fact-backed extraction fields", () => {
    const contract = materializeGenericDocumentExtractionContract({
      createdAt: "2026-04-09T21:00:00.000Z",
      documentChecksumSha256: "sha256:doc",
      documentId: "doc_123",
      plan: {
        documentFamily: "generic-business-document",
        observations: [
          {
            canonicalFactTypeId: null,
            confidenceScore: 0.91,
            excerpt: "Customer segment: Commercial",
            key: "customer segment",
            label: "Customer segment",
            locator: {
              column: null,
              fieldPath: null,
              lineEnd: 4,
              lineStart: 4,
              page: null,
              reference: null,
              row: null,
              sheet: null,
            },
            locatorType: "line-range",
            value: "Commercial",
            valueType: "text",
          },
          {
            canonicalFactTypeId: null,
            confidenceScore: 0.88,
            excerpt: null,
            key: "open_balance",
            label: "Open balance",
            locator: {
              column: null,
              fieldPath: null,
              lineEnd: null,
              lineStart: null,
              page: null,
              reference: null,
              row: 2,
              sheet: "Sheet1",
            },
            locatorType: "cell",
            value: 4200,
            valueType: "number",
          },
        ],
      },
    });

    expect(contract.documentFamily).toBe("generic-business-document");
    expect(contract.requiresHumanReview).toBe(false);
    expect(contract.fields).toMatchObject([
      {
        canonicalFactTypeId: "document.observation.text",
        key: "customer_segment",
        label: "Customer segment",
        value: "Commercial",
      },
      {
        canonicalFactTypeId: "document.observation.number",
        key: "open_balance",
        label: "Open balance",
        value: 4200,
      },
    ]);
    expect(contract.fields[0]?.citations[0]?.documentFamily).toBe(
      "generic-business-document",
    );
  });
});
