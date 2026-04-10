import { describe, expect, it } from "vitest";

import { createProcessingPolicy } from "@/features/governance/domain/processing-policy";

describe("processing policy", () => {
  it("builds a stable typed processing policy record", () => {
    const policy = createProcessingPolicy({
      embeddingsEnabled: true,
      extractionEnabled: true,
      humanReviewRequired: false,
      id: "policy_123",
      name: "Default upload policy",
      orgId: "org_123",
      parserRoute: "tabular",
      redactionPolicyKey: "tabular-financial-export",
      retentionPolicyKey: "manual-upload-hot-30d",
      scopeKey: "upload",
      scopeKind: "source",
    });

    expect(policy).toMatchObject({
      id: "policy_123",
      parserRoute: "tabular",
      version: "processing-policy.v1",
    });
  });
});
