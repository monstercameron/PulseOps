import { describe, expect, it } from "vitest";

import {
  calculateTextParserConfidence,
  createTextParserArtifact,
} from "@/features/parsing/domain/text-parser-artifact";

describe("text parser artifact", () => {
  it("normalizes text artifacts and scores confidence from extracted text", () => {
    const artifact = createTextParserArtifact({
      confidenceScore: calculateTextParserConfidence(
        "Invoice INV-001\nAmount Due 4200\nDue Date 2026-04-14",
      ),
      createdAt: "2026-04-09T23:00:00.000Z",
      documentId: "doc_123",
      id: "text_artifact_123",
      parserKind: "docx",
      text: "Invoice INV-001\r\n\r\nAmount Due 4200\r\n",
    });

    expect(artifact.sectionCount).toBe(2);
    expect(artifact.text).toBe("Invoice INV-001\nAmount Due 4200");
    expect(artifact.textLength).toBeGreaterThan(10);
  });
});
