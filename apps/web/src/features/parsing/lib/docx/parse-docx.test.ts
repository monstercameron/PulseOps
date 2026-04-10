import { Buffer } from "node:buffer";

import { Document, Packer, Paragraph, TextRun } from "docx";
import { describe, expect, it } from "vitest";

import { parseDocxBuffer } from "@/features/parsing/lib/docx/parse-docx";

describe("parseDocxBuffer", () => {
  it("extracts normalized text from a docx buffer", async () => {
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
    const result = await parseDocxBuffer(buffer);

    expect(result.text).toContain("Invoice INV-001");
    expect(result.text).toContain("Amount Due 4200");
    expect(result.confidenceScore).toBeGreaterThan(0.6);
  });
});
