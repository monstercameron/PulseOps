import { Buffer } from "node:buffer";

import { Document, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { parseTextDocumentWithService } from "@/features/parsing/services/text-parser-service";

describe("text parser service", () => {
  it("parses docx documents into text parser artifacts", async () => {
    const document = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("Invoice INV-001")],
            }),
            new Paragraph({
              children: [new TextRun("Amount Due 4200")],
            }),
          ],
        },
      ],
    });
    const buffer = Buffer.from(await Packer.toBuffer(document));
    const result = await parseTextDocumentWithService({
      body: buffer,
      documentId: "doc_123",
      fileName: "invoice.docx",
      parserArtifactId: "text_artifact_123",
    });

    expect(result.format).toBe("docx");
    expect(result.textParserArtifact.parserKind).toBe("docx");
    expect(result.textParserArtifact.text).toContain("Invoice INV-001");
  });

  it("parses pdf documents into text parser artifacts", async () => {
    const pdfDocument = await PDFDocument.create();
    const page = pdfDocument.addPage([400, 300]);
    const font = await pdfDocument.embedFont(StandardFonts.Helvetica);

    page.drawText("Invoice INV-001", {
      font,
      size: 18,
      x: 40,
      y: 240,
    });
    page.drawText("Amount Due 4200", {
      font,
      size: 16,
      x: 40,
      y: 210,
    });

    const result = await parseTextDocumentWithService({
      body: Buffer.from(await pdfDocument.save()),
      documentId: "doc_456",
      fileName: "invoice.pdf",
      parserArtifactId: "text_artifact_456",
    });

    expect(result.format).toBe("pdf");
    expect(result.metadata.pageCount).toBe(1);
    expect(result.textParserArtifact.text).toContain("Amount Due 4200");
  });

  it("parses json documents into flattened text parser artifacts", async () => {
    const result = await parseTextDocumentWithService({
      body: Buffer.from(
        JSON.stringify({
          customerName: "Acme Heating",
          invoiceId: "INV-001",
        }),
        "utf8",
      ),
      documentId: "doc_789",
      fileName: "invoice.json",
      parserArtifactId: "text_artifact_789",
    });

    expect(result.format).toBe("json");
    expect(result.metadata.flattenedFieldCount).toBeGreaterThan(1);
    expect(result.textParserArtifact.parserKind).toBe("json");
  });
});
