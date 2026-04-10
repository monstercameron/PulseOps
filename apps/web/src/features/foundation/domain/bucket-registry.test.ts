import { describe, expect, it } from "vitest";

import {
  bucketDimensionIds,
  getBucketDimension,
  getBucketRegistrySummary,
  isBucketDimensionId,
} from "@/features/foundation/domain/bucket-registry";

describe("bucket registry", () => {
  it("defines the approved bucket dimensions from architecture", () => {
    expect(bucketDimensionIds).toHaveLength(10);
    expect(getBucketRegistrySummary()).toEqual({
      bucketDimensionCount: 10,
      ids: bucketDimensionIds,
    });
  });

  it("resolves known bucket ids and rejects unknown ones", () => {
    expect(isBucketDimensionId("crew")).toBe(true);
    expect(isBucketDimensionId("random_bucket")).toBe(false);
    expect(getBucketDimension("margin_band")?.label).toBe("Margin band");
  });
});
