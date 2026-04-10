import { describe, expect, it } from "vitest";

import {
  calculateTabularParserConfidence,
  createParserArtifact,
} from "@/features/parsing/domain/parser-artifact";

describe("parser artifact", () => {
  it("creates parser artifacts from tabular sheet summaries", () => {
    const parserArtifact = createParserArtifact({
      createdAt: "2026-04-09T16:00:00.000Z",
      documentId: "doc_123",
      id: "artifact_123",
      parserKind: "csv",
      sheets: [
        {
          columnCount: 4,
          headers: [
            "invoice_number",
            "customer_name",
            "due_date",
            "amount_due",
          ],
          name: "Sheet1",
          rowCount: 18,
        },
      ],
    });

    expect(parserArtifact.sheetCount).toBe(1);
    expect(parserArtifact.totalRowCount).toBe(18);
    expect(parserArtifact.confidenceScore).toBeGreaterThan(0.8);
  });

  it("rejects empty confidence inputs", () => {
    expect(() => calculateTabularParserConfidence([])).toThrow(
      "Parser confidence requires at least one sheet summary.",
    );
  });
});
