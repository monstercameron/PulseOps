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

type UploadReviewState = "duplicate" | "processing" | "ready" | "received";

type UploadNextAction = "explorer" | "pipeline";

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
  const uploadRetentionDays = settingsRecord.dataPolicy.sourceRetentionDays.upload;

  const upload = await dependencies.submitTabularUpload({
    archiveAfterDays: uploadRetentionDays,
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
    source: "upload",
  });
  const processedUpload = await dependencies.processQueuedUpload?.();
  const persistedDocument =
    upload.isDuplicate || dependencies.processQueuedUpload !== undefined
      ? await dependencies.documentRepository.getById(upload.document.id)
      : null;
  const suggestedDocumentFamily =
    processedUpload?.classification?.suggestedDocumentFamily ??
    persistedDocument?.suggestedDocumentFamily ??
    null;
  const classificationConfidenceScore =
    processedUpload?.classification?.confidenceScore ??
    persistedDocument?.classificationConfidenceScore ??
    null;

  return Response.json({
    classificationConfidenceScore,
    detectedFormat: routing.format,
    documentId: upload.document.id,
    ingestionEventId: upload.ingestionEvent.id,
    ingestionJobId: upload.ingestionJob.id,
    isDuplicate: upload.isDuplicate,
    materializedChunkCount: processedUpload?.materializedChunkCount ?? null,
    materializedFactCount: processedUpload?.materializedFactCount ?? null,
    nextAction: resolveUploadNextAction({
      isDuplicate: upload.isDuplicate,
      processedUpload,
      queuedStatus: upload.ingestionJob.status,
    }),
    parserRoute: routing.parserRoute,
    processedStatus: processedUpload?.ingestionJob.status ?? null,
    retainSourceFile,
    reviewState: resolveUploadReviewState({
      isDuplicate: upload.isDuplicate,
      processedUpload,
      queuedStatus: upload.ingestionJob.status,
    }),
    status: processedUpload?.ingestionJob.status ?? upload.ingestionJob.status,
    suggestedDocumentFamily,
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
      return Response.json(
        {
          errorCode: "unsupported_format",
          errorHelp: "Use a CSV or XLSX file on this manual upload path.",
          errorTitle: "This file cannot go through this upload path",
          error:
            "This file type is not supported on this upload path yet. Please upload a CSV or XLSX file.",
        },
        { status: 415 },
      );
    }

    if (error instanceof UploadFormatMismatchError) {
      return Response.json(
        {
          errorCode: "format_mismatch",
          errorHelp:
            "Open the file, export it again in the same format, and then try one more time.",
          errorTitle: "The file contents do not match the file extension",
          error:
            "This file does not match its extension. Please save or export it again, then try once more.",
        },
        { status: 422 },
      );
    }

    if (error instanceof UploadSizeExceededError) {
      return Response.json(
        {
          errorCode: "file_too_large",
          errorHelp:
            "CSV files can be up to 5 MB and XLSX files can be up to 20 MB on this path.",
          errorTitle: "This file is too large for manual upload",
          error:
            "This file is too large for this upload path. Please use a smaller file and try again.",
        },
        { status: 413 },
      );
    }

    if (error instanceof ProtectedUploadError) {
      return Response.json(
        {
          errorCode: "protected_file",
          errorHelp:
            "Remove the password from the file before uploading it again.",
          errorTitle: "This file is password protected",
          error:
            "This file is password protected. Remove the password and upload it again.",
        },
        { status: 422 },
      );
    }

    throw error;
  }
}

function resolveUploadReviewState(
  input: Readonly<{
    isDuplicate: boolean;
    processedUpload: ProcessedQueuedTabularUpload | null | undefined;
    queuedStatus: string;
  }>,
): UploadReviewState {
  if (input.isDuplicate) {
    return "duplicate";
  }

  const normalizedStatus = getNormalizedUploadStatus(
    input.processedUpload?.ingestionJob.status ?? input.queuedStatus,
  );

  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "extracted" ||
    (input.processedUpload?.materializedFactCount ?? 0) > 0
  ) {
    return "ready";
  }

  if (
    normalizedStatus === "queued" ||
    normalizedStatus === "started" ||
    normalizedStatus === "parsing" ||
    normalizedStatus === "parsed" ||
    normalizedStatus === "classified" ||
    normalizedStatus === "extracting" ||
    normalizedStatus === "processing"
  ) {
    return "processing";
  }

  return "received";
}

function resolveUploadNextAction(
  input: Readonly<{
    isDuplicate: boolean;
    processedUpload: ProcessedQueuedTabularUpload | null | undefined;
    queuedStatus: string;
  }>,
): UploadNextAction {
  const reviewState = resolveUploadReviewState(input);

  return reviewState === "ready" || reviewState === "duplicate"
    ? "explorer"
    : "pipeline";
}

function getNormalizedUploadStatus(status: string) {
  return status.trim().toLowerCase();
}
