import { describe, expect, it } from "vitest";

import {
  buildFactEvidenceSummary,
  formatFactValue,
  resolveFactLabel,
} from "@/features/facts/domain/fact-presentation";
import { createCitation } from "@/features/trust/domain/citation";

describe("fact presentation", () => {
  it("uses the source field key as a readable fallback label for generic observations", () => {
    expect(
      resolveFactLabel({
        canonicalFactTypeId: "document.observation.number",
        sourceFieldKey: "sheet1.row_2.amount_outstanding",
      }),
    ).toBe("Amount outstanding");
  });

  it("formats generic monetary observations using label and source hints", () => {
    expect(
      formatFactValue({
        canonicalFactTypeId: "document.observation.number",
        label: "Total profit",
        sourceFieldKey: "seed.total_profit",
        value: 44168198.4,
      }),
    ).toBe("$44,168,198.40");
  });

  it("builds readable evidence summaries from citation locators", () => {
    expect(
      buildFactEvidenceSummary([
        createCitation({
          confidenceScore: 0.93,
          documentFamily: "customer-invoice",
          documentId: "doc_123",
          locator: {
            column: "amount_outstanding",
            row: 2,
            sheet: "Sheet1",
          },
          locatorType: "cell",
          sourceHash: "sha256:invoice-row",
        }),
      ]),
    ).toBe("Column amount outstanding / Row 2 / Sheet Sheet1");
  });
});
