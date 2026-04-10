import { describe, expect, it } from "vitest";

import {
  buildTabularExtractionPrompt,
  materializeTabularExtractionContract,
  validateTabularExtractionPlan,
} from "@/features/extraction/domain/tabular-extraction-plan";

describe("tabular extraction plan", () => {
  const sheets = [
    {
      columnCount: 5,
      headers: [
        "invoice_number",
        "customer_name",
        "due_date",
        "amount_due",
        "invoice_total",
      ],
      name: "Sheet1",
      records: [
        {
          amount_due: "2100.50",
          customer_name: "Acme Heating",
          due_date: "2026-04-14",
          invoice_number: "INV-001",
          invoice_total: "4200.75",
        },
        {
          amount_due: "1900.25",
          customer_name: "Bravo Air",
          due_date: "4/15/2026",
          invoice_number: "INV-002",
          invoice_total: "3900.25",
        },
      ],
      rowCount: 2,
    },
  ];

  it("builds prompts with allowed semantic mappings and sample rows", () => {
    const prompt = buildTabularExtractionPrompt({
      documentFamily: "customer-invoice",
      fileName: "customer-invoice-export.csv",
      parserArtifact: {
        confidenceScore: 0.92,
        createdAt: "2026-04-09T22:00:00.000Z",
        documentId: "doc_123",
        id: "artifact_123",
        parserKind: "csv",
        sheetCount: 1,
        sheets: [
          {
            columnCount: 5,
            headers: [
              "invoice_number",
              "customer_name",
              "due_date",
              "amount_due",
              "invoice_total",
            ],
            name: "Sheet1",
            rowCount: 2,
          },
        ],
        totalRowCount: 2,
      },
      sheets,
    });

    expect(prompt).toContain("customer-invoice");
    expect(prompt).toContain("semanticKey: invoice_number");
    expect(prompt).toContain('"invoice_number": "INV-001"');
  });

  it("materializes row-scoped extraction contracts from validated mappings", () => {
    const contract = materializeTabularExtractionContract({
      createdAt: "2026-04-09T22:05:00.000Z",
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      plan: {
        documentFamily: "customer-invoice",
        fieldMappings: [
          {
            confidenceScore: 0.97,
            semanticKey: "invoice_number",
            sheetName: "Sheet1",
            sourceFieldKey: "invoice_number",
          },
          {
            confidenceScore: 0.95,
            semanticKey: "due_date",
            sheetName: "Sheet1",
            sourceFieldKey: "due_date",
          },
          {
            confidenceScore: 0.96,
            semanticKey: "amount_outstanding",
            sheetName: "Sheet1",
            sourceFieldKey: "amount_due",
          },
          {
            confidenceScore: 0.94,
            semanticKey: "invoice_total",
            sheetName: "Sheet1",
            sourceFieldKey: "invoice_total",
          },
        ],
        rationale: "Invoice export headers match the customer invoice semantic set.",
      },
      sheets,
    });

    expect(contract.requiresHumanReview).toBe(false);
    expect(contract.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          canonicalFactTypeId: "invoice.amount.outstanding",
          key: "sheet1.row_2.amount_outstanding",
          value: 2100.5,
        }),
        expect.objectContaining({
          key: "sheet1.row_3.invoice_number",
          value: "INV-002",
        }),
        expect.objectContaining({
          canonicalFactTypeId: "invoice.due_at",
          key: "sheet1.row_3.due_date",
          value: "2026-04-15",
        }),
      ]),
    );
  });

  it("rejects invalid sheet or source-field mappings", () => {
    expect(() =>
      validateTabularExtractionPlan(
        {
          documentFamily: "customer-invoice",
          fieldMappings: [
            {
              confidenceScore: 0.82,
              semanticKey: "invoice_number",
              sheetName: "MissingSheet",
              sourceFieldKey: "invoice_number",
            },
          ],
          rationale: "Invalid test plan.",
        },
        sheets,
      ),
    ).toThrow("Unknown sheet in extraction plan");
  });
});
