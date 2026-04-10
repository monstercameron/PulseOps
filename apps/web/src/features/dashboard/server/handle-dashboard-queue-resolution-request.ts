import { randomUUID } from "node:crypto";

import { z } from "zod";

import { createAuditLog, type AuditLog } from "@/features/audit/domain/audit-log";
import { type AuditLogRepository } from "@/features/audit/repositories/audit-log-repository";
import { createQueueEvent, type QueueEvent } from "@/features/dashboard/domain/queue-event";
import { type QueueEventRepository } from "@/features/dashboard/repositories/queue-event-repository";

const dashboardQueueResolutionRequestSchema = z.object({
  action: z.string().min(1),
  actorId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  queueItemId: z.string().min(1),
});

type DashboardQueueResolutionDependencies = Readonly<{
  auditLogRepository: AuditLogRepository;
  generateId?: () => string;
  now?: () => string;
  queueEventRepository: QueueEventRepository;
  revalidatePaths?: (paths: readonly string[]) => void | Promise<void>;
}>;

export async function handleDashboardQueueResolutionRequest(
  request: Request,
  dependencies: DashboardQueueResolutionDependencies,
) {
  const parsedBody = dashboardQueueResolutionRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid dashboard queue resolution payload.",
      },
      { status: 400 },
    );
  }

  const result = await persistDashboardQueueResolution({
    action: parsedBody.data.action,
    actorId: parsedBody.data.actorId ?? "local-ui",
    auditLogRepository: dependencies.auditLogRepository,
    generateId: dependencies.generateId,
    now: dependencies.now,
    orgId: parsedBody.data.orgId,
    queueEventRepository: dependencies.queueEventRepository,
    queueItemId: parsedBody.data.queueItemId,
    revalidatePaths: dependencies.revalidatePaths,
  });

  return Response.json(
    {
      auditLogId: result.auditLog.id,
      orgId: parsedBody.data.orgId,
      queueEvent: result.queueEvent,
    },
    { status: 201 },
  );
}

export async function persistDashboardQueueResolution(input: Readonly<{
  action: string;
  actorId: string;
  auditLogRepository: AuditLogRepository;
  generateId?: () => string;
  now?: () => string;
  orgId: string;
  queueEventRepository: QueueEventRepository;
  queueItemId: string;
  revalidatePaths?: (paths: readonly string[]) => void | Promise<void>;
}>): Promise<Readonly<{
  auditLog: AuditLog;
  queueEvent: QueueEvent;
}>> {
  const timestamp = input.now?.() ?? new Date().toISOString();
  const queueEvent = await input.queueEventRepository.put(
    createQueueEvent({
      action: input.action,
      actorId: input.actorId,
      id: input.generateId?.() ?? randomUUID(),
      itemId: input.queueItemId,
      orgId: input.orgId,
      resolvedAt: timestamp,
    }),
  );
  const auditLog = await input.auditLogRepository.put(
    createAuditLog({
      action: "dashboard.queue.resolved",
      actorId: input.actorId,
      createdAt: timestamp,
      entityId: input.queueItemId,
      id: input.generateId?.() ?? randomUUID(),
      metadata: {
        action: input.action,
        queueItemId: input.queueItemId,
        resolvedAt: timestamp,
      },
      orgId: input.orgId,
    }),
  );

  await input.revalidatePaths?.(["/dashboard"]);

  return {
    auditLog,
    queueEvent,
  };
}
