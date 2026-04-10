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

  it("supports custom archive windows while preserving source-specific naming", () => {
    expect(
      resolveUploadLifecyclePolicy("upload", {
        archiveAfterDays: 14,
      }),
    ).toEqual({
      archiveAfterDays: 14,
      retentionPolicyKey: "manual-upload-hot-14d",
    });

    expect(
      resolveUploadLifecyclePolicy("email", {
        archiveAfterDays: 21,
        retainSourceFile: false,
      }),
    ).toEqual({
      archiveAfterDays: 21,
      retentionPolicyKey: "email-hot-21d-purge-source",
    });
  });
});
