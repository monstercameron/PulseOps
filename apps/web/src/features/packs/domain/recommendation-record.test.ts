import { describe, expect, it } from "vitest";

import { createRecommendationRecord } from "@/features/packs/domain/recommendation-record";

describe("recommendation record", () => {
  it("persists recommendation metadata separately from the UI pack", () => {
    const recommendation = createRecommendationRecord({
      actions: ["Call customer"],
      citations: ["invoice_123 row 2"],
      confidenceScore: 0.92,
      decisionRunId: "decision_123",
      id: "rec_123",
      kind: "collect-overdue-invoice",
      orgId: "org_123",
      priorityScore: 3.2,
      status: "open",
      summary: "Start collections on the highest aging balance.",
      supportingFactIds: ["fact_123"],
      title: "Collect overdue invoice",
    });

    expect(recommendation).toMatchObject({
      id: "rec_123",
      kind: "collect-overdue-invoice",
      version: "recommendation-record.v1",
    });
  });
});
