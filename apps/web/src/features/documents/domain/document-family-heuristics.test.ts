import { describe, expect, it } from "vitest";

import { classifyDocumentFamily } from "@/features/documents/domain/document-family-heuristics";

describe("document family heuristics", () => {
  it("classifies customer invoice headers", () => {
    const classification = classifyDocumentFamily({
      fileName: "customer-invoice-export.csv",
      headers: [
        "invoice_number",
        "customer_name",
        "due_date",
        "amount_due",
        "invoice_id",
      ],
    });

    expect(classification?.suggestedDocumentFamily).toBe("customer-invoice");
    expect(classification?.confidenceScore).toBeGreaterThan(0.8);
  });

  it("returns null when signals are too weak", () => {
    expect(
      classifyDocumentFamily({
        fileName: "mystery-file.csv",
        headers: ["col_a", "col_b", "col_c"],
      }),
    ).toBeNull();
  });
});
