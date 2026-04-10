import { z } from "zod";

import {
  ProtectedUploadError,
  resolveUploadRouting,
  UnsupportedUploadFormatError,
  UploadFormatMismatchError,
  UploadSizeExceededError,
} from "@/features/documents/domain/document-format";
import { type SubmitTabularUploadToQueueInput } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { type ProcessedQueuedTabularUpload } from "@/features/ingestion/services/process-next-ingestion-job";
import { shouldRetainUploadedSourceFiles } from "@/features/settings/domain/settings-preferences";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import { getSettingsRecord } from "@/features/settings/server/settings-record-service";

const fileUploadFormSchema = z.object({
  file: z.instanceof(File),
  orgId: z.string().min(1),
});

type QueuedUploadResult = {
  document: {
    id: string;
  };
  ingestionEvent: {
    id: string;
  };
  ingestionJob: {
    id: string;
    status: string;
  };
  isDuplicate: boolean;
};

type FileUploadDependencies = Pick<
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
  ) => Promise<QueuedUploadResult>;
  processQueuedUpload?: () => Promise<ProcessedQueuedTabularUpload | null>;
};

export async function handleFileUpload(
  request: Request,
  dependencies: FileUploadDependencies,
): Promise<Response> {
  const formData = await request.formData();
  const parsedForm = fileUploadFormSchema.parse({
    file: formData.get("file"),
    orgId: formData.get("orgId"),
  });
  const body = Buffer.from(await parsedForm.file.arrayBuffer());
  const routing = tryResolveUploadRouting({
    body,
    contentType: parsedForm.file.type || undefined,
    fileName: parsedForm.file.name,
  });

  if (routing instanceof Response) {
    return routing;
  }

  const settingsRecord = await getSettingsRecord(
    dependencies.settingsRepository,
    parsedForm.orgId,
  );
  const retainSourceFile = shouldRetainUploadedSourceFiles(
    settingsRecord.preferences,
  );

  const upload = await dependencies.submitTabularUpload({
    body,
    contentType: routing.detectedContentType,
    documentRepository: dependencies.documentRepository,
    fileName: parsedForm.file.name,
    ingestionEventRepository: dependencies.ingestionEventRepository,
    ingestionJobRepository: dependencies.ingestionJobRepository,
    orgId: parsedForm.orgId,
    queue: dependencies.queue,
    retainSourceFile,
    storage: dependencies.storage,
  });
  const processedUpload = await dependencies.processQueuedUpload?.();

  return Response.json({
    documentId: upload.document.id,
    ingestionEventId: upload.ingestionEvent.id,
    ingestionJobId: upload.ingestionJob.id,
    isDuplicate: upload.isDuplicate,
    materializedChunkCount: processedUpload?.materializedChunkCount ?? null,
    materializedFactCount: processedUpload?.materializedFactCount ?? null,
    processedStatus: processedUpload?.ingestionJob.status ?? null,
    status: processedUpload?.ingestionJob.status ?? upload.ingestionJob.status,
  });
}

function tryResolveUploadRouting(input: {
  body: Buffer;
  contentType?: string;
  fileName: string;
}): Response | ReturnType<typeof resolveUploadRouting> {
  try {
    return resolveUploadRouting(input);
  } catch (error) {
    if (error instanceof UnsupportedUploadFormatError) {
      return Response.json({ error: error.message }, { status: 415 });
    }

    if (error instanceof UploadFormatMismatchError) {
      return Response.json({ error: error.message }, { status: 422 });
    }

    if (error instanceof UploadSizeExceededError) {
      return Response.json({ error: error.message }, { status: 413 });
    }

    if (error instanceof ProtectedUploadError) {
      return Response.json({ error: error.message }, { status: 422 });
    }

    throw error;
  }
}
