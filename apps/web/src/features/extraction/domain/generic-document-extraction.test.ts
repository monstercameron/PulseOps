import { describe, expect, it } from "vitest";

import {
  buildGenericDocumentExtractionPrompt,
  buildTabularBusinessSummary,
  getGenericDocumentExtractionInstructions,
  materializeGenericDocumentExtractionContract,
} from "@/features/extraction/domain/generic-document-extraction";

describe("generic document extraction", () => {
  it("builds a tabular prompt with supported family context", () => {
    const prompt = buildGenericDocumentExtractionPrompt({
      documentFamilyHint: "customer-invoice",
      fileName: "ledger.csv",
      parserRoute: "tabular",
      tabularBusinessSummary:
        "Sheet summary: Sheet1\nRow count: 2\nNumeric columns:\n- amount: sum=6100 | avg=3050 | min=1900 | max=4200",
      tabularPreview: "Sheet: Sheet1\nRow 2: account=Sales | amount=4200",
    });

    expect(prompt).toContain("File name: ledger.csv");
    expect(prompt).toContain("Prior family hint: customer-invoice.");
    expect(prompt).toContain("generic-business-document");
    expect(prompt).toContain("Computed business summary:");
    expect(prompt).toContain("sum=6100");
    expect(prompt).toContain("title, heading, statement name, or reporting period");
    expect(getGenericDocumentExtractionInstructions()).toContain("high-value");
    expect(getGenericDocumentExtractionInstructions()).toContain("balanced set");
  });

  it("builds a compact business summary for tabular sheets", () => {
    const summary = buildTabularBusinessSummary([
      {
        columnCount: 5,
        headers: [
          "branch",
          "date",
          "gross_income",
          "product_line",
          "total",
        ],
        name: "Sheet1",
        records: [
          {
            branch: "A",
            date: "1/5/2019",
            gross_income: "26.1415",
            product_line: "Health and beauty",
            total: "548.9715",
          },
          {
            branch: "C",
            date: "3/8/2019",
            gross_income: "3.82",
            product_line: "Electronic accessories",
            total: "80.22",
          },
          {
            branch: "A",
            date: "3/3/2019",
            gross_income: "16.2155",
            product_line: "Home and lifestyle",
            total: "340.53",
          },
          {
            branch: "B",
            date: "1/27/2019",
            gross_income: "23.288",
            product_line: "Health and beauty",
            total: "489.05",
          },
          {
            branch: "C",
            date: "2/8/2019",
            gross_income: "30.2085",
            product_line: "Sports and travel",
            total: "634.38",
          },
        ],
        rowCount: 5,
      },
    ]);

    expect(summary).toContain("Numeric columns:");
    expect(summary).toContain("Date columns:");
    expect(summary).toContain("Top contributors:");
    expect(summary).toContain("branch by total");
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
