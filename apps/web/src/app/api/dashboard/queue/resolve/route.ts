import { revalidatePath } from "next/cache";

import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handleDashboardQueueResolutionRequest } from "@/features/dashboard/server/handle-dashboard-queue-resolution-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const POST = createLoggedRouteHandler({
  feature: "dashboard",
  handler: async (request) =>
    handleDashboardQueueResolutionRequest(request, {
      auditLogRepository: localIngestionRuntime.auditLogRepository,
      queueEventRepository: localIngestionRuntime.queueEventRepository,
      revalidatePaths: (paths) => {
        paths.forEach((path) => revalidatePath(path));
      },
    }),
  route: "/api/dashboard/queue/resolve",
});
