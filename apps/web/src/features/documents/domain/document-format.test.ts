import { describe, expect, it } from "vitest";

import {
  ProtectedUploadError,
  getDocumentFormatPolicy,
  UploadFormatMismatchError,
  UnsupportedUploadFormatError,
  UploadSizeExceededError,
  resolveUploadRouting,
} from "@/features/documents/domain/document-format";

describe("document format routing", () => {
  it("accepts supported Phase A text formats via content sniffing", () => {
    const routing = resolveUploadRouting({
      body: Buffer.from('{"invoiceId":"INV-001","amountDue":4200}', "utf8"),
      fileName: "invoice.json",
    });

    expect(routing).toMatchObject({
      detectedContentType: "application/json",
      format: "json",
      parserRoute: "text",
    });
  });

  it("rejects mismatched extension versus file signature", () => {
    expect(() =>
      resolveUploadRouting({
        body: Buffer.from("%PDF-1.7\nhello", "utf8"),
        fileName: "invoice.csv",
      }),
    ).toThrow(UploadFormatMismatchError);
  });

  it("rejects unsupported upload extensions", () => {
    expect(() =>
      resolveUploadRouting({
        body: Buffer.from([0x00, 0x01, 0x02, 0x03]),
        fileName: "notes.bin",
      }),
    ).toThrow(UnsupportedUploadFormatError);
  });

  it("accepts unknown text extensions by falling back to plain text routing", () => {
    const routing = resolveUploadRouting({
      body: Buffer.from("Technician notes\nCollected deposit from customer.", "utf8"),
      fileName: "field-note.md",
    });

    expect(routing).toMatchObject({
      detectedContentType: "text/plain",
      format: "txt",
      parserRoute: "text",
    });
  });

  it("enforces per-format upload size guards", () => {
    expect(() =>
      resolveUploadRouting({
        body: Buffer.alloc(2 * 1024 * 1024 + 1, 0x61),
        fileName: "notes.txt",
      }),
    ).toThrow(UploadSizeExceededError);
  });

  it("rejects password-protected pdf uploads", () => {
    expect(() =>
      resolveUploadRouting({
        body: Buffer.from("%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>", "utf8"),
        fileName: "secure.pdf",
      }),
    ).toThrow(ProtectedUploadError);
  });

  it("exposes downstream routing policy by format", () => {
    expect(getDocumentFormatPolicy("csv")).toMatchObject({
      parserRoute: "tabular",
      requiresHumanReviewBeforeVector: false,
      vectorEligibility: "never",
    });
    expect(getDocumentFormatPolicy("pdf")).toMatchObject({
      parserRoute: "text",
      requiresHumanReviewBeforeVector: true,
      vectorEligibility: "review",
    });
  });
});
