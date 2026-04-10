import { describe, expect, it } from "vitest";

import { performOcrFallback } from "@/features/parsing/lib/ocr/ocr-fallback";

describe("performOcrFallback", () => {
  it("keeps strong primary text without invoking OCR", async () => {
    const ocrEngine = {
      recognizeImage: async () => ({
        confidenceScore: 0.5,
        text: "fallback should not run",
      }),
    };

    const result = await performOcrFallback({
      buffer: Buffer.from("image", "utf8"),
      ocrEngine,
      primaryText: "Invoice INV-001 Amount Due 4200",
    });

    expect(result.usedOcrFallback).toBe(false);
    expect(result.text).toContain("Invoice INV-001");
  });

  it("uses OCR when primary text is too weak", async () => {
    const result = await performOcrFallback({
      buffer: Buffer.from("image", "utf8"),
      ocrEngine: {
        recognizeImage: async () => ({
          confidenceScore: 0.87,
          text: "Scanned invoice INV-002 amount due 1800",
        }),
      },
      primaryText: "  ",
    });

    expect(result.usedOcrFallback).toBe(true);
    expect(result.text).toContain("INV-002");
    expect(result.confidenceScore).toBeGreaterThan(0.8);
  });
});
