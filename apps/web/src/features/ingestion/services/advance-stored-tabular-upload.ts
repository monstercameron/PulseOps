import {
  attachDocumentClassification,
  markDocumentFailed,
  markDocumentParsed,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import {
  classifyDocumentFamily,
  type DocumentFamilyClassification,
} from "@/features/documents/domain/document-family-heuristics";
import {
  canTransitionIngestionJobStatus,
  transitionIngestionJob,
  type IngestionJob,
} from "@/features/ingestion/domain/ingestion-job";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { parseDocumentWithService } from "@/features/parsing/services/parser-service";
import {
  buildStructuredLogEntry,
  serializeStructuredLogEntry,
} from "@/features/observability/lib/structured-logger";

export type AdvancedStoredTabularUpload = {
  classification: DocumentFamilyClassification | null;
  document: DocumentRecord;
  ingestionJob: IngestionJob;
  parserArtifact: ParserArtifact;
  primaryTableName: string;
};

type AdvanceStoredTabularUploadInput = {
  body: Buffer;
  document: DocumentRecord;
  generateId: () => string;
  ingestionJob: IngestionJob;
  log?: (message: string) => void;
  now?: () => string;
};

export class AdvanceStoredTabularUploadError extends Error {
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
    this.name = "AdvanceStoredTabularUploadError";
  }
}

export async function advanceStoredTabularUpload(
  input: AdvanceStoredTabularUploadInput,
): Promise<AdvancedStoredTabularUpload> {
  const now = input.now ?? (() => new Date().toISOString());
  const emitLog = input.log ?? (() => undefined);
  let document = input.document;
  let ingestionJob = input.ingestionJob;

  try {
    if (document.rawObject === undefined) {
      throw new Error(
        "Stored tabular upload requires a document raw object reference.",
      );
    }

    ingestionJob = transitionIngestionJob(ingestionJob, "parsing", now());

    const { parserArtifact, tableExtractionPlan } =
      await parseDocumentWithService({
        body: input.body,
        createdAt: now(),
        documentId: document.id,
        fileName: document.fileName,
        parserArtifactId: input.generateId(),
      });

    document = markDocumentParsed(document, parserArtifact.id, now());
    ingestionJob = transitionIngestionJob(ingestionJob, "classifying", now());

    const classification = classifyDocumentFamily({
      fileName: document.fileName,
      headers: Array.from(
        new Set(parserArtifact.sheets.flatMap((sheet) => sheet.headers)),
      ),
    });

    if (classification !== null) {
      document = attachDocumentClassification(
        document,
        classification.suggestedDocumentFamily,
        classification.confidenceScore,
        now(),
      );
    }

    ingestionJob = transitionIngestionJob(ingestionJob, "extracting", now());

    emitLog(
      serializeStructuredLogEntry({
        data: {
          parserArtifactId: parserArtifact.id,
          parserKind: parserArtifact.parserKind,
          primaryTableName: tableExtractionPlan.primaryTableName,
          sheetCount: parserArtifact.sheetCount,
          totalRowCount: parserArtifact.totalRowCount,
        },
        documentId: document.id,
        feature: "ingestion",
        jobId: ingestionJob.id,
        level: "info",
        message: "Processed stored tabular upload into parser artifact.",
        orgId: document.orgId,
        service: "web",
      }),
    );

    return {
      classification,
      document,
      ingestionJob,
      parserArtifact,
      primaryTableName:
        tableExtractionPlan.primaryTableName ??
        parserArtifact.sheets[0]?.name ??
        "Sheet1",
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

    throw new AdvanceStoredTabularUploadError(failureMessage, failureState);
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
      : markDocumentFailed(document, failedAt);
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
    document: failedDocument,
    ingestionJob: failedIngestionJob,
  };
}

export function buildStoredTabularUploadFailureLog(input: {
  document: DocumentRecord;
  failureMessage: string;
  ingestionJob: IngestionJob;
}): string {
  return JSON.stringify(
    buildStructuredLogEntry({
      data: {
        error: input.failureMessage,
        fileName: input.document.fileName,
      },
      documentId: input.document.id,
      feature: "ingestion",
      jobId: input.ingestionJob.id,
      level: "error",
      message: "Failed to process stored tabular upload.",
      orgId: input.document.orgId,
      service: "web",
    }),
  );
}
