import { describe, expect, it } from "vitest";

import {
  getMetricDefinition,
  getMetricRegistrySummary,
  metricRegistry,
} from "@/features/foundation/domain/metric-registry";

describe("metric registry", () => {
  it("defines the first operational metric set", () => {
    expect(metricRegistry).toHaveLength(10);
    expect(getMetricRegistrySummary().metricCount).toBe(10);
  });

  it("exposes metric definitions with canonical fact dependencies", () => {
    const metric = getMetricDefinition("gross_margin_bps");

    expect(metric?.inputFactTypeIds).toContain("job.margin.gross");
    expect(metric?.dimensionIds).toContain("job_type");
  });
});
