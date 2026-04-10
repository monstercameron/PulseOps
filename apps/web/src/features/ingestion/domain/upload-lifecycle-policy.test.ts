import { describe, expect, it } from "vitest";

import { resolveUploadLifecyclePolicy } from "@/features/ingestion/domain/upload-lifecycle-policy";

describe("upload lifecycle policy", () => {
  it("assigns source-specific archive and retention defaults", () => {
    expect(resolveUploadLifecyclePolicy("upload")).toEqual({
      archiveAfterDays: 30,
      retentionPolicyKey: "manual-upload-hot-30d",
    });
    expect(resolveUploadLifecyclePolicy("email")).toEqual({
      archiveAfterDays: 45,
      retentionPolicyKey: "email-hot-45d",
    });
  });
});
