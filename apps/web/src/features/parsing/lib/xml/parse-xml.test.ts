import { describe, expect, it } from "vitest";

import { parseXmlBuffer } from "@/features/parsing/lib/xml/parse-xml";

describe("parseXmlBuffer", () => {
  it("flattens xml documents into deterministic text fields", () => {
    const result = parseXmlBuffer(
      Buffer.from(
        [
          '<?xml version="1.0"?>',
          "<invoice>",
          "<invoiceId>INV-001</invoiceId>",
          "<amountDue currency=\"USD\">4200</amountDue>",
          "</invoice>",
        ].join(""),
        "utf8",
      ),
    );

    expect(result.flattenedFieldCount).toBeGreaterThanOrEqual(2);
    expect(result.text).toContain("root.invoice.invoiceId: INV-001");
    expect(result.text).toContain("root.invoice.amountDue.#text: 4200");
  });
});
