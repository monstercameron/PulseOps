import { describe, expect, it } from "vitest";

import { createUploadedDocument } from "@/features/documents/domain/document";
import { createOpenAiDocumentExtractionService } from "@/features/extraction/services/openai-document-extraction-service";
import { createParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { createTextParserArtifact } from "@/features/parsing/domain/text-parser-artifact";

describe("openai document extraction service", () => {
  it("falls back to generic tabular observations when no supported tabular family mapping exists", async () => {
    const service = createOpenAiDocumentExtractionService({
      model: "gpt-5-mini",
      now: () => "2026-04-09T21:15:00.000Z",
      runGenericDocumentExtraction: async () => ({
        documentFamily: "generic-business-document",
        observations: [
          {
            canonicalFactTypeId: null,
            confidenceScore: 0.9,
            excerpt: null,
            key: "reported_profit",
            label: "Reported profit",
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
            value: 44168198.4,
            valueType: "number",
          },
        ],
      }),
      runTabularExtractionPlan: async () => ({
        documentFamily: "customer-invoice",
        fieldMappings: [],
        rationale: "No-op",
      }),
    });

    const contract = await service.extract({
      body: Buffer.from("Region,Profit\nWest,44168198.4", "utf8"),
      classification: null,
      document: createUploadedDocument({
        fileName: "regional-profit.csv",
        id: "doc_123",
        orgId: "org_123",
      }),
      parserArtifact: createParserArtifact({
        documentId: "doc_123",
        id: "artifact_123",
        parserKind: "csv",
        sheets: [
          {
            columnCount: 2,
            headers: ["region", "profit"],
            name: "Sheet1",
            rowCount: 1,
          },
        ],
      }),
      parserRoute: "tabular",
    });

    expect(contract?.documentFamily).toBe("generic-business-document");
    expect(contract?.fields).toMatchObject([
      {
        canonicalFactTypeId: "document.observation.number",
        key: "reported_profit",
        label: "Reported profit",
        value: 44168198.4,
      },
    ]);
  });

  it("extracts generic observations from parsed text documents", async () => {
    const service = createOpenAiDocumentExtractionService({
      model: "gpt-5-mini",
      now: () => "2026-04-09T21:30:00.000Z",
      runGenericDocumentExtraction: async (input) => {
        expect(input.trackingContext).toMatchObject({
          documentId: "doc_text_123",
          feature: "extraction",
          operation: "generic-document-extraction",
          orgId: "org_123",
        });

        return {
          documentFamily: "customer-invoice",
          observations: [
            {
              canonicalFactTypeId: "invoice.amount.outstanding",
              confidenceScore: 0.93,
              excerpt: "Balance due: 4200",
              key: "amount_due",
              label: "Amount due",
              locator: {
                column: null,
                fieldPath: null,
                lineEnd: 3,
                lineStart: 3,
                page: null,
                reference: null,
                row: null,
                sheet: null,
              },
              locatorType: "line-range",
              value: 4200,
              valueType: "number",
            },
          ],
        };
      },
      runTabularExtractionPlan: async () => ({
        documentFamily: "customer-invoice",
        fieldMappings: [],
        rationale: "No-op",
      }),
    });

    const contract = await service.extract({
      body: Buffer.from("Invoice INV-001\nBalance due: 4200", "utf8"),
      document: createUploadedDocument({
        fileName: "invoice-notes.txt",
        id: "doc_text_123",
        orgId: "org_123",
      }),
      parserRoute: "text",
      textParserArtifact: createTextParserArtifact({
        confidenceScore: 0.91,
        documentId: "doc_text_123",
        id: "text_artifact_123",
        parserKind: "txt",
        text: "Invoice INV-001\nBalance due: 4200",
      }),
    });

    expect(contract?.documentFamily).toBe("customer-invoice");
    expect(contract?.fields[0]).toMatchObject({
      canonicalFactTypeId: "invoice.amount.outstanding",
      key: "amount_due",
      label: "Amount due",
      value: 4200,
    });
  });
});
