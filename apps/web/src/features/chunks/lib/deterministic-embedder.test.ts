import { describe, expect, it } from "vitest";

import {
  cosineSimilarity,
  createDeterministicTextEmbedder,
} from "@/features/chunks/lib/deterministic-embedder";

describe("createDeterministicTextEmbedder", () => {
  it("produces stable normalized vectors for the same input text", () => {
    const embedder = createDeterministicTextEmbedder({
      dimensions: 8,
    });

    const leftVector = embedder.embedText("Invoice INV-001 amount total 4200");
    const rightVector = embedder.embedText("Invoice INV-001 amount total 4200");

    expect(leftVector).toEqual(rightVector);
    expect(leftVector).toHaveLength(8);
    expect(cosineSimilarity(leftVector, rightVector)).toBe(1);
  });

  it("separates materially different texts", () => {
    const embedder = createDeterministicTextEmbedder({
      dimensions: 8,
    });

    const invoiceVector = embedder.embedText(
      "Invoice INV-001 amount total 4200",
    );
    const payrollVector = embedder.embedText(
      "Crew hours payroll export 18 hours",
    );

    expect(cosineSimilarity(invoiceVector, payrollVector)).toBeLessThan(0.95);
  });
});
