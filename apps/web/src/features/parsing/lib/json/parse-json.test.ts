import { describe, expect, it } from "vitest";

import { parseJsonBuffer } from "@/features/parsing/lib/json/parse-json";

describe("parseJsonBuffer", () => {
  it("normalizes and flattens json objects into deterministic text", () => {
    const result = parseJsonBuffer(
      Buffer.from(
        JSON.stringify({
          amountDue: 4200,
          invoiceId: "INV-001",
          lineItems: [{ description: "Tune-up", quantity: 1 }],
        }),
        "utf8",
      ),
    );

    expect(result.flattenedFieldCount).toBeGreaterThan(2);
    expect(result.text).toContain("root.amountDue: 4200");
    expect(result.text).toContain("root.lineItems[0].description: Tune-up");
  });
});
