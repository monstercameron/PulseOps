import { describe, expect, it } from "vitest";

import { parseTxtBuffer } from "@/features/parsing/lib/txt/parse-txt";

describe("parseTxtBuffer", () => {
  it("decodes utf8 text buffers into normalized text", () => {
    const result = parseTxtBuffer(
      Buffer.from("Invoice INV-001\r\n\r\nAmount Due 4200", "utf8"),
    );

    expect(result.text).toBe("Invoice INV-001\nAmount Due 4200");
    expect(result.confidenceScore).toBeGreaterThan(0.6);
  });

  it("detects utf16le text with a BOM", () => {
    const utf16Buffer = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from("A\u0000m\u0000o\u0000u\u0000n\u0000t\u0000", "utf16le"),
    ]);

    const result = parseTxtBuffer(utf16Buffer);

    expect(result.text).toContain("Amount");
  });
});
