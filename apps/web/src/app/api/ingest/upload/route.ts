import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { processNextIngestionJob } from "@/features/ingestion/services/process-next-ingestion-job";
import { submitTabularUploadToQueue } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { handleFileUpload } from "@/features/uploads/server/handle-file-upload";

export const POST = createLoggedRouteHandler({
  feature: "uploads",
  handler: async (request, context) =>
    handleFileUpload(request, {
    ...localIngestionRuntime,
      processQueuedUpload: () =>
        processNextIngestionJob({
          ...localIngestionRuntime,
        }),
      submitTabularUpload: (input) =>
        submitTabularUploadToQueue({
          ...input,
          log: context.emitStructuredLogLine,
          requestId: context.requestId,
        }),
    }),
  route: "/api/ingest/upload",
});
