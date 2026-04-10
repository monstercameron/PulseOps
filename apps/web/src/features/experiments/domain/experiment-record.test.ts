import { describe, expect, it } from "vitest";

import { createExperimentRecord } from "@/features/experiments/domain/experiment-record";

describe("experiment record", () => {
  it("captures a runnable prompt experiment", () => {
    const experiment = createExperimentRecord({
      hypothesis: "Explicit urgency framing improves operator acceptance.",
      id: "experiment_123",
      orgId: "org_123",
      primaryMetric: "acceptance_rate",
      promptFamily: "weekly-brief-recommendations",
      startedAt: "2026-04-09T18:00:00.000Z",
      status: "running",
      variantId: "variant_a",
    });

    expect(experiment).toMatchObject({
      id: "experiment_123",
      status: "running",
      version: "experiment-record.v1",
    });
  });
});
