import { describe, expect, it } from "vitest";

import { createDecisionRun } from "@/features/packs/domain/decision-run";

describe("decision run", () => {
  it("captures a completed decision-pack run", () => {
    const decisionRun = createDecisionRun({
      completedAt: "2026-04-09T18:01:00.000Z",
      id: "decision_123",
      orgId: "org_123",
      packId: "pack_123",
      packKey: "weekly-cash-margin-brief",
      recommendationCount: 3,
      sourceDocumentIds: ["doc_123"],
      startedAt: "2026-04-09T18:00:00.000Z",
      status: "completed",
      summary: "Three recommendations generated.",
      supportingFactIds: ["fact_123"],
      updatedAt: "2026-04-09T18:01:00.000Z",
    });

    expect(decisionRun).toMatchObject({
      id: "decision_123",
      recommendationCount: 3,
      status: "completed",
    });
  });
});
