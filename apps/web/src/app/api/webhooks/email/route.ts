import { resolveServerPaths } from "@/features/config/server-env";
import { submitTabularUploadToQueue } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { handleEmailForwardingWebhook } from "@/features/integrations/email/server/handle-email-forwarding-webhook";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

const serverPaths = resolveServerPaths();

export const POST = createLoggedRouteHandler({
  feature: "uploads",
  handler: async (request, context) =>
    handleEmailForwardingWebhook(request, {
    ...localIngestionRuntime,
      submitTabularUpload: (input) =>
        submitTabularUploadToQueue({
          ...input,
          log: context.emitStructuredLogLine,
          requestId: context.requestId,
        }),
      webhookSecret: serverPaths.webhookSecret,
    }),
  route: "/api/webhooks/email",
});
