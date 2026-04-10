import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

import {
  ProtectedUploadError,
  resolveUploadRouting,
  UnsupportedUploadFormatError,
  UploadFormatMismatchError,
  UploadSizeExceededError,
} from "@/features/documents/domain/document-format";
import { type SubmitTabularUploadToQueueInput } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { shouldRetainUploadedSourceFiles } from "@/features/settings/domain/settings-preferences";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import { getSettingsRecord } from "@/features/settings/server/settings-record-service";

const emailAttachmentSchema = z.object({
  base64Body: z.string().min(1),
  contentType: z.string().min(1).optional(),
  fileName: z.string().min(1),
});

const forwardedEmailWebhookSchema = z.object({
  attachments: z.array(emailAttachmentSchema).min(1),
  messageId: z.string().min(1),
  orgId: z.string().min(1),
});

type QueuedEmailUploadResult = {
  document: {
    id: string;
  };
  ingestionJob: {
    id: string;
  };
};

type EmailWebhookDependencies = Pick<
  SubmitTabularUploadToQueueInput,
  | "documentRepository"
  | "ingestionEventRepository"
  | "ingestionJobRepository"
  | "queue"
  | "storage"
> & {
  settingsRepository?: SettingsRepository;
  submitTabularUpload: (
    input: SubmitTabularUploadToQueueInput,
  ) => Promise<QueuedEmailUploadResult>;
  webhookSecret: string;
};

export async function handleEmailForwardingWebhook(
  request: Request,
  dependencies: EmailWebhookDependencies,
): Promise<Response> {
  const requestSecret = request.headers.get("x-webhook-secret");

  if (
    requestSecret === null ||
    !safeSecretsEqual(requestSecret, dependencies.webhookSecret)
  ) {
    return Response.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const payload = forwardedEmailWebhookSchema.parse(await request.json());
  const settingsRecord = await getSettingsRecord(
    dependencies.settingsRepository,
    payload.orgId,
  );
  const retainSourceFile = shouldRetainUploadedSourceFiles(
    settingsRecord.preferences,
  );
  const emailRetentionDays = settingsRecord.dataPolicy.sourceRetentionDays.email;
  const acceptedUploads = [];
  const rejectedAttachments = [];

  for (const attachment of payload.attachments) {
    const body = Buffer.from(attachment.base64Body, "base64");
    const routing = tryResolveUploadRouting({
      body,
      contentType: attachment.contentType,
      fileName: attachment.fileName,
    });

    if (routing instanceof Error) {
      rejectedAttachments.push({
        fileName: attachment.fileName,
        reason: routing.message,
      });
      continue;
    }

    const upload = await dependencies.submitTabularUpload({
      archiveAfterDays: emailRetentionDays,
      body,
      contentType: routing.detectedContentType,
      documentRepository: dependencies.documentRepository,
      fileName: attachment.fileName,
      ingestionEventRepository: dependencies.ingestionEventRepository,
      ingestionJobRepository: dependencies.ingestionJobRepository,
      orgId: payload.orgId,
      queue: dependencies.queue,
      retainSourceFile,
      storage: dependencies.storage,
      source: "email",
    });

    acceptedUploads.push({
      documentId: upload.document.id,
      fileName: attachment.fileName,
      ingestionJobId: upload.ingestionJob.id,
    });
  }

  return Response.json({
    acceptedUploads,
    messageId: payload.messageId,
    rejectedAttachments,
  });
}

function tryResolveUploadRouting(input: {
  body: Buffer;
  contentType?: string;
  fileName: string;
}): Error | ReturnType<typeof resolveUploadRouting> {
  try {
    return resolveUploadRouting(input);
  } catch (error) {
    if (
      error instanceof UnsupportedUploadFormatError ||
      error instanceof UploadFormatMismatchError ||
      error instanceof UploadSizeExceededError ||
      error instanceof ProtectedUploadError
    ) {
      return error;
    }

    throw error;
  }
}

function safeSecretsEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
