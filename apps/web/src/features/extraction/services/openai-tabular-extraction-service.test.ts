import { describe, expect, it } from "vitest";

import { createUploadedDocument } from "@/features/documents/domain/document";
import { createOpenAiTabularExtractionService } from "@/features/extraction/services/openai-tabular-extraction-service";

describe("openai tabular extraction service", () => {
  it("turns a structured extraction plan into a deterministic extraction contract", async () => {
    const extractionService = createOpenAiTabularExtractionService({
      model: "gpt-5-mini",
      now: () => "2026-04-09T22:15:00.000Z",
      runTabularExtractionPlan: async (input) => {
        expect(input.trackingContext).toMatchObject({
          documentId: "doc_123",
          feature: "extraction",
          operation: "tabular-extraction-plan",
          orgId: "org_123",
        });

        return {
          documentFamily: "customer-invoice",
          fieldMappings: [
            {
              confidenceScore: 0.98,
              semanticKey: "invoice_number",
              sheetName: "Sheet1",
              sourceFieldKey: "invoice_number",
            },
            {
              confidenceScore: 0.96,
              semanticKey: "due_date",
              sheetName: "Sheet1",
              sourceFieldKey: "due_date",
            },
            {
              confidenceScore: 0.97,
              semanticKey: "amount_outstanding",
              sheetName: "Sheet1",
              sourceFieldKey: "amount_due",
            },
          ],
          rationale: "The headers clearly represent invoice identifiers, due dates, and open balances.",
        };
      },
    });

    const contract = await extractionService.extract({
      body: Buffer.from(
        "invoice_number,customer_name,due_date,amount_due\nINV-001,Acme Heating,2026-04-14,4200\nINV-002,Bravo Air,2026-04-21,3100",
        "utf8",
      ),
      classification: {
        confidenceScore: 0.94,
        matchedSignals: ["invoice_number", "customer_name", "due_date"],
        suggestedDocumentFamily: "customer-invoice",
      },
      document: createUploadedDocument({
        fileName: "customer-invoice-export.csv",
        id: "doc_123",
        orgId: "org_123",
      }),
      parserArtifact: {
        confidenceScore: 0.91,
        createdAt: "2026-04-09T22:14:00.000Z",
        documentId: "doc_123",
        id: "artifact_123",
        parserKind: "csv",
        sheetCount: 1,
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
            rowCount: 2,
          },
        ],
        totalRowCount: 2,
      },
    });

    expect(contract?.documentFamily).toBe("customer-invoice");
    expect(contract?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "sheet1.row_2.invoice_number",
          value: "INV-001",
        }),
        expect.objectContaining({
          canonicalFactTypeId: "invoice.amount.outstanding",
          key: "sheet1.row_3.amount_outstanding",
          value: 3100,
        }),
      ]),
    );
  });

  it("returns null for classified families without a supported mapping spec", async () => {
    const extractionService = createOpenAiTabularExtractionService({
      model: "gpt-5-mini",
      runTabularExtractionPlan: async () => {
        throw new Error("Runner should not execute for unsupported families.");
      },
    });

    await expect(
      extractionService.extract({
        body: Buffer.from("account_number,account_name\n1000,Cash", "utf8"),
        classification: {
          confidenceScore: 0.89,
          matchedSignals: ["account_number", "account_name"],
          suggestedDocumentFamily: "chart-of-accounts-export",
        },
        document: createUploadedDocument({
          fileName: "chart-of-accounts.csv",
          id: "doc_456",
          orgId: "org_123",
        }),
        parserArtifact: {
          confidenceScore: 0.9,
          createdAt: "2026-04-09T22:20:00.000Z",
          documentId: "doc_456",
          id: "artifact_456",
          parserKind: "csv",
          sheetCount: 1,
          sheets: [
            {
              columnCount: 2,
              headers: ["account_number", "account_name"],
              name: "Sheet1",
              rowCount: 1,
            },
          ],
          totalRowCount: 1,
        },
      }),
    ).resolves.toBeNull();
  });
});
