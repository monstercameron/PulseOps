import { Buffer } from "node:buffer";

import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { parsePdfBuffer } from "@/features/parsing/lib/pdf/parse-pdf";

describe("parsePdfBuffer", () => {
  it("extracts text from a generated PDF buffer", async () => {
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

    const result = await parsePdfBuffer(Buffer.from(await pdfDocument.save()));

    expect(result.pageCount).toBe(1);
    expect(result.text).toContain("Invoice INV-001");
    expect(result.text).toContain("Amount Due 4200");
  });
});
