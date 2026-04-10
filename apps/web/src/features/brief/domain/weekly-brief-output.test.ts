import { describe, expect, it } from "vitest";

import {
  createWeeklyBriefOutput,
  getWeeklyBriefQuestionCoverage,
} from "@/features/brief/domain/weekly-brief-output";
import { createCitation } from "@/features/trust/domain/citation";

describe("weekly brief output", () => {
  it("sorts items and computes summary fields", () => {
    const output = createWeeklyBriefOutput({
      briefId: "brief_123",
      generatedAt: "2026-04-09T16:00:00.000Z",
      items: [
        {
          citations: [
            createCitation({
              confidenceScore: 0.9,
              documentFamily: "customer-invoice",
              documentId: "doc_1",
              locator: { row: 8 },
              locatorType: "row",
              sourceHash: "sha256:a",
            }),
          ],
          confidenceScore: 0.9,
          estimatedValueCents: 520000,
          id: "item_b",
          impactSummary: "Collect overdue cash from the oldest invoices.",
          priorityScore: 7.2,
          questionId: "which-invoices-to-chase-today",
          recommendationKind: "collect-overdue-invoice",
          title: "Call three overdue accounts today",
        },
        {
          citations: [
            createCitation({
              confidenceScore: 0.81,
              documentFamily: "job-cost-report",
              documentId: "doc_2",
              locator: { row: 5 },
              locatorType: "row",
              sourceHash: "sha256:b",
            }),
          ],
          confidenceScore: 0.81,
          estimatedValueCents: 210000,
          id: "item_a",
          impactSummary:
            "Margin is leaking on callback-heavy maintenance jobs.",
          priorityScore: 5.4,
          questionId: "where-is-margin-leaking",
          recommendationKind: "investigate-margin-leak",
          title: "Review maintenance callbacks by crew",
        },
      ],
      orgId: "org_123",
    });

    expect(output.items.map((item) => item.id)).toEqual(["item_b", "item_a"]);
    expect(output.summary).toEqual({
      highConfidenceItemCount: 1,
      topQuestionIds: [
        "which-invoices-to-chase-today",
        "where-is-margin-leaking",
      ],
      totalEstimatedValueCents: 730000,
    });
    expect(getWeeklyBriefQuestionCoverage(output)).toEqual([
      "which-invoices-to-chase-today",
      "where-is-margin-leaking",
    ]);
  });
});
