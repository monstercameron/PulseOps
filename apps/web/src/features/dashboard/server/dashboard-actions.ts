"use server";

import { revalidatePath } from "next/cache";

import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { persistDashboardQueueResolution } from "@/features/dashboard/server/handle-dashboard-queue-resolution-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export async function resolveQueueItemAction(
  queueItemId: string,
  action: string,
  orgId = DEFAULT_WORKSPACE.orgId,
): Promise<void> {
  await persistDashboardQueueResolution({
    action,
    actorId: "local-ui",
    auditLogRepository: localIngestionRuntime.auditLogRepository,
    orgId,
    queueEventRepository: localIngestionRuntime.queueEventRepository,
    queueItemId,
    revalidatePaths: (paths) => {
      paths.forEach((path) => revalidatePath(path));
    },
  });
}
