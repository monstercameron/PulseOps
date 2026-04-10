import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { parseDocumentWithService } from "@/features/parsing/services/parser-service";

describe("parser service", () => {
  it("parses csv documents into parser artifacts and table plans", async () => {
    const result = await parseDocumentWithService({
      body: Buffer.from(
        "Invoice Number,Customer Name,Due Date,Amount Due\nINV-001,Acme Heating,2026-04-14,4200",
        "utf8",
      ),
      createdAt: "2026-04-09T16:00:00.000Z",
      documentId: "doc_123",
      fileName: "customer-invoice-export.csv",
      parserArtifactId: "artifact_123",
    });

    expect(result.parserArtifact.parserKind).toBe("csv");
    expect(result.parserArtifact.totalRowCount).toBe(1);
    expect(result.tableExtractionPlan.primaryTableName).toBe("Sheet1");
  });

  it("parses xlsx documents into parser artifacts and table plans", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invoices");

    worksheet.addRow(["Invoice Number", "Customer Name", "Amount Due"]);
    worksheet.addRow(["INV-001", "Acme Heating", 4200]);

    const result = await parseDocumentWithService({
      body: Buffer.from(await workbook.xlsx.writeBuffer()),
      documentId: "doc_456",
      fileName: "invoices.xlsx",
      parserArtifactId: "artifact_456",
    });

    expect(result.parserArtifact.parserKind).toBe("xlsx");
    expect(result.parserArtifact.sheetCount).toBe(1);
    expect(result.tableExtractionPlan.primaryTableName).toBe("Invoices");
  });

  it("rejects unsupported file extensions", async () => {
    await expect(
      parseDocumentWithService({
        body: Buffer.from("hello", "utf8"),
        documentId: "doc_789",
        fileName: "notes.txt",
        parserArtifactId: "artifact_789",
      }),
    ).rejects.toThrow("Unsupported tabular file extension: txt");
  });
});
