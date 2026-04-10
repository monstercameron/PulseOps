import { describe, expect, it } from "vitest";

import {
  confidenceBandFromScore,
  createCitation,
} from "@/features/trust/domain/citation";

describe("citation", () => {
  it("maps confidence scores into stable bands", () => {
    expect(confidenceBandFromScore(0.91)).toBe("high");
    expect(confidenceBandFromScore(0.7)).toBe("medium");
    expect(confidenceBandFromScore(0.32)).toBe("low");
  });

  it("creates a validated citation payload", () => {
    const citation = createCitation({
      confidenceScore: 0.92,
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      excerpt: "Invoice total $4,200 due on 2026-04-14.",
      locator: {
        row: 8,
        sheet: "Invoices",
      },
      locatorType: "row",
      sourceHash: "sha256:abc123",
    });

    expect(citation.version).toBe("citation.v1");
    expect(citation.confidenceBand).toBe("high");
    expect(citation.documentId).toBe("doc_123");
  });

  it("rejects invalid confidence scores", () => {
    expect(() => confidenceBandFromScore(1.2)).toThrow();
  });
});
