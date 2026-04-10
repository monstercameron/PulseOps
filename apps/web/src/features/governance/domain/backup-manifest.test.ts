import { describe, expect, it } from "vitest";

import { buildBackupManifest } from "@/features/governance/domain/backup-manifest";

describe("backup manifest", () => {
  it("builds reproducible backup manifests", () => {
    expect(
      buildBackupManifest({
        createdAt: "2026-04-10T03:00:00.000Z",
        id: "backup_1",
        includedPaths: [".local-data/records", ".local-data/storage"],
        orgId: "org_123",
      }),
    ).toMatchObject({
      includedPaths: [".local-data/records", ".local-data/storage"],
      version: "backup-manifest.v1",
    });
  });
});
