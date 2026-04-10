import { markDocumentParsed, type DocumentRecord } from "@/features/documents/domain/document";
import {
  canTransitionIngestionJobStatus,
  transitionIngestionJob,
  type IngestionJob,
} from "@/features/ingestion/domain/ingestion-job";
import {
  buildStructuredLogEntry,
  serializeStructuredLogEntry,
} from "@/features/observability/lib/structured-logger";
import { type TextParserArtifact } from "@/features/parsing/domain/text-parser-artifact";
import { parseTextDocumentWithService } from "@/features/parsing/services/text-parser-service";

export type AdvancedStoredTextUpload = {
  document: DocumentRecord;
  format: string;
  ingestionJob: IngestionJob;
  textParserArtifact: TextParserArtifact;
};

type AdvanceStoredTextUploadInput = {
  body: Buffer;
  document: DocumentRecord;
  generateId: () => string;
  ingestionJob: IngestionJob;
  log?: (message: string) => void;
  now?: () => string;
};

export class AdvanceStoredTextUploadError extends Error {
  readonly document: DocumentRecord;
  readonly ingestionJob: IngestionJob;

  constructor(
    message: string,
    state: {
      document: DocumentRecord;
      ingestionJob: IngestionJob;
    },
  ) {
    super(message);
    this.document = state.document;
    this.ingestionJob = state.ingestionJob;
    this.name = "AdvanceStoredTextUploadError";
  }
}

export async function advanceStoredTextUpload(
  input: AdvanceStoredTextUploadInput,
): Promise<AdvancedStoredTextUpload> {
  const now = input.now ?? (() => new Date().toISOString());
  const emitLog = input.log ?? (() => undefined);
  let document = input.document;
  let ingestionJob = input.ingestionJob;

  try {
    if (document.rawObject === undefined) {
      throw new Error("Stored text upload requires a document raw object reference.");
    }

    ingestionJob = transitionIngestionJob(ingestionJob, "parsing", now());

    const parsedDocument = await parseTextDocumentWithService({
      body: input.body,
      contentType: document.contentType,
      createdAt: now(),
      documentId: document.id,
      fileName: document.fileName,
      parserArtifactId: input.generateId(),
    });

    document = markDocumentParsed(document, parsedDocument.textParserArtifact.id, now());
    ingestionJob = transitionIngestionJob(ingestionJob, "classifying", now());
    ingestionJob = transitionIngestionJob(ingestionJob, "extracting", now());
    ingestionJob = transitionIngestionJob(ingestionJob, "normalizing", now());
    ingestionJob = transitionIngestionJob(ingestionJob, "completed", now());

    emitLog(
      serializeStructuredLogEntry({
        data: {
          format: parsedDocument.format,
          parserArtifactId: parsedDocument.textParserArtifact.id,
          parserKind: parsedDocument.textParserArtifact.parserKind,
          sectionCount: parsedDocument.textParserArtifact.sectionCount,
          textLength: parsedDocument.textParserArtifact.textLength,
          usedOcrFallback: parsedDocument.textParserArtifact.usedOcrFallback,
          ...parsedDocument.metadata,
        },
        documentId: document.id,
        feature: "ingestion",
        jobId: ingestionJob.id,
        level: "info",
        message: "Processed stored text upload into parser artifact.",
        orgId: document.orgId,
        service: "web",
      }),
    );

    return {
      document,
      format: parsedDocument.format,
      ingestionJob,
      textParserArtifact: parsedDocument.textParserArtifact,
    };
  } catch (error) {
    const failureMessage =
      error instanceof Error ? error.message : "Unknown ingestion failure";
    const failureState = buildFailureState({
      document,
      failedAt: now(),
      failureMessage,
      ingestionJob,
    });

    throw new AdvanceStoredTextUploadError(failureMessage, failureState);
  }
}

type BuildFailureStateInput = {
  document: DocumentRecord;
  failedAt: string;
  failureMessage: string;
  ingestionJob: IngestionJob;
};

function buildFailureState({
  document,
  failedAt,
  failureMessage,
  ingestionJob,
}: BuildFailureStateInput): {
  document: DocumentRecord;
  ingestionJob: IngestionJob;
} {
  const failedDocument =
    document.status === "failed"
      ? document
      : { ...document, status: "failed", updatedAt: failedAt };
  const failedIngestionJob =
    ingestionJob.status === "failed" ||
    !canTransitionIngestionJobStatus(ingestionJob.status, "failed")
      ? ingestionJob
      : transitionIngestionJob(
          ingestionJob,
          "failed",
          failedAt,
          failureMessage,
        );

  return {
    document: failedDocument as DocumentRecord,
    ingestionJob: failedIngestionJob,
  };
}

export function buildStoredTextUploadFailureLog(input: {
  document: DocumentRecord;
  failureMessage: string;
  ingestionJob: IngestionJob;
}): string {
  return JSON.stringify(
    buildStructuredLogEntry({
      data: {
        error: input.failureMessage,
        format: input.document.fileExtension,
      },
      documentId: input.document.id,
      feature: "ingestion",
      jobId: input.ingestionJob.id,
      level: "error",
      message: "Failed to process stored text upload.",
      orgId: input.document.orgId,
      service: "web",
    }),
  );
}
