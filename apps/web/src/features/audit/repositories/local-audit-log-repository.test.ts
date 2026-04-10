import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createAuditLog } from "@/features/audit/domain/audit-log";
import { createLocalAuditLogRepository } from "@/features/audit/repositories/local-audit-log-repository";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("createLocalAuditLogRepository", () => {
  it("persists audit log entries by org", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-audit-"),
    );
    temporaryDirectories.push(rootDirectory);

    const repository = createLocalAuditLogRepository({
      rootDirectory,
    });

    await repository.put(
      createAuditLog({
        action: "document.uploaded",
        actorId: "user_123",
        createdAt: "2026-04-10T03:30:00.000Z",
        entityId: "doc_123",
        id: "audit_123",
        metadata: {
          route: "/api/ingest/upload",
        },
        orgId: "org_123",
      }),
    );

    expect(await repository.listByOrgId("org_123")).toHaveLength(1);
  });
});
