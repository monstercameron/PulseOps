import { randomUUID } from "node:crypto";

import {
  attachStoredObjectToDocument,
  createUploadedDocument,
  markDocumentFailed,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import { type DocumentFamilyClassification } from "@/features/documents/domain/document-family-heuristics";
import {
  createIngestionJob,
  transitionIngestionJob,
  type IngestionJob,
} from "@/features/ingestion/domain/ingestion-job";
import {
  AdvanceStoredTabularUploadError,
  advanceStoredTabularUpload,
  buildStoredTabularUploadFailureLog,
} from "@/features/ingestion/services/advance-stored-tabular-upload";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";
import {
  buildObjectStorageKey,
  type ObjectStorage,
  type StoredObject,
} from "@/features/storage/lib/object-storage";

export type ProcessTabularUploadInput = {
  body: Buffer;
  contentType?: string;
  fileName: string;
  generateId?: () => string;
  log?: (message: string) => void;
  now?: () => string;
  orgId: string;
  storage: ObjectStorage;
};

export type ProcessedTabularUpload = {
  classification: DocumentFamilyClassification | null;
  document: DocumentRecord;
  ingestionJob: IngestionJob;
  parserArtifact: ParserArtifact;
  storageObject: StoredObject;
};

export class ProcessTabularUploadError extends Error {
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
    this.name = "ProcessTabularUploadError";
  }
}

export async function processTabularUpload(
  input: ProcessTabularUploadInput,
): Promise<ProcessedTabularUpload> {
  const now = input.now ?? (() => new Date().toISOString());
  const generateId = input.generateId ?? randomUUID;
  const emitLog = input.log ?? (() => undefined);
  const createdAt = now();
  const documentId = generateId();
  const jobId = generateId();
  const parserArtifactId = generateId();

  let document = createUploadedDocument(
    {
      contentType: input.contentType,
      fileName: input.fileName,
      id: documentId,
      orgId: input.orgId,
    },
    createdAt,
  );

  let ingestionJob = createIngestionJob(
    {
      documentId,
      id: jobId,
      orgId: input.orgId,
    },
    createdAt,
  );

  try {
    const objectKey = buildObjectStorageKey({
      createdAt,
      documentId,
      fileName: input.fileName,
      orgId: input.orgId,
    });
    const storageObject = await input.storage.putObject({
      body: input.body,
      contentType: document.contentType,
      key: objectKey,
      metadata: {
        documentId,
        orgId: input.orgId,
      },
    });

    document = attachStoredObjectToDocument(document, storageObject, now());
    const advancedUpload = await advanceStoredTabularUpload({
      body: input.body,
      document,
      generateId: () => parserArtifactId,
      ingestionJob,
      log: emitLog,
      now,
    });

    document = advancedUpload.document;
    ingestionJob = advancedUpload.ingestionJob;

    return {
      classification: advancedUpload.classification,
      document,
      ingestionJob,
      parserArtifact: advancedUpload.parserArtifact,
      storageObject,
    };
  } catch (error) {
    const failureMessage =
      error instanceof Error ? error.message : "Unknown ingestion failure";

    if (error instanceof AdvanceStoredTabularUploadError) {
      document = error.document;
      ingestionJob = error.ingestionJob;
    } else {
      document = markDocumentFailed(document, now());
      ingestionJob = transitionIngestionJob(
        ingestionJob,
        "failed",
        now(),
        failureMessage,
      );
    }

    emitLog(
      buildStoredTabularUploadFailureLog({
        document,
        failureMessage,
        ingestionJob,
      }),
    );

    throw new ProcessTabularUploadError(failureMessage, {
      document,
      ingestionJob,
    });
  }
}
