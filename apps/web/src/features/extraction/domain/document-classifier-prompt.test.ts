import { describe, expect, it } from "vitest";

import { buildDocumentClassifierPrompt } from "@/features/extraction/domain/document-classifier-prompt";

describe("document classifier prompt", () => {
  it("renders the allowed document families and strict output contract", () => {
    const prompt = buildDocumentClassifierPrompt({
      fileName: "customer-invoice-export.csv",
      headers: ["invoice_number", "customer_name", "due_date", "amount_due"],
      sampleRows: [
        {
          amount_due: "4200",
          customer_name: "Acme Heating",
          due_date: "2026-04-14",
          invoice_number: "INV-001",
        },
      ],
    });

    expect(prompt).toContain("Return strict JSON with keys");
    expect(prompt).toContain("customer-invoice");
    expect(prompt).toContain("vendor-bill");
    expect(prompt).toContain(
      "Headers: invoice_number, customer_name, due_date, amount_due",
    );
  });
});
