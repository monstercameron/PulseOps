import { describe, expect, it } from "vitest";

import { parseHtmlBuffer } from "@/features/parsing/lib/html/parse-html";

describe("parseHtmlBuffer", () => {
  it("extracts cleaned text, links, and tables from html buffers", () => {
    const result = parseHtmlBuffer(
      Buffer.from(
        [
          "<!doctype html>",
          "<html><head><title>Invoice</title></head><body>",
          '<a href="https://example.com/invoice">View</a>',
          "<table><tr><td>Amount Due</td><td>4200</td></tr></table>",
          "</body></html>",
        ].join(""),
        "utf8",
      ),
    );

    expect(result.title).toBe("Invoice");
    expect(result.linkCount).toBe(1);
    expect(result.tableCount).toBe(1);
    expect(result.text).toContain("Amount Due");
  });
});
