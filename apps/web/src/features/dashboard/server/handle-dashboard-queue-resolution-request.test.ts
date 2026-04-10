import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createLocalAuditLogRepository } from "@/features/audit/repositories/local-audit-log-repository";
import { createLocalQueueEventRepository } from "@/features/dashboard/repositories/local-queue-event-repository";
import { handleDashboardQueueResolutionRequest } from "@/features/dashboard/server/handle-dashboard-queue-resolution-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleDashboardQueueResolutionRequest", () => {
  it("persists queue resolution events and audit logs", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-queue-resolve-"),
    );
    temporaryDirectories.push(rootDirectory);

    const auditLogRepository = createLocalAuditLogRepository({ rootDirectory });
    const queueEventRepository = createLocalQueueEventRepository({ rootDirectory });
    const revalidatePaths = vi.fn();
    const response = await handleDashboardQueueResolutionRequest(
      new Request("http://localhost/api/dashboard/queue/resolve", {
        body: JSON.stringify({
          action: "Dismiss",
          actorId: "user_123",
          orgId: "org_123",
          queueItemId: "failed-documents",
        }),
        method: "POST",
      }),
      {
        auditLogRepository,
        generateId: () => "event_or_audit_123",
        now: () => "2026-04-10T02:00:00.000Z",
        queueEventRepository,
        revalidatePaths,
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      auditLogId: "event_or_audit_123",
      queueEvent: expect.objectContaining({
        action: "Dismiss",
        itemId: "failed-documents",
      }),
    });
    await expect(queueEventRepository.listByOrgId("org_123")).resolves.toEqual([
      expect.objectContaining({
        action: "Dismiss",
        itemId: "failed-documents",
      }),
    ]);
    await expect(auditLogRepository.listByOrgId("org_123")).resolves.toEqual([
      expect.objectContaining({
        action: "dashboard.queue.resolved",
        entityId: "failed-documents",
      }),
    ]);
    expect(revalidatePaths).toHaveBeenCalledWith(["/dashboard"]);
  });
});
