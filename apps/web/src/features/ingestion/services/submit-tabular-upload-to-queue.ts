import { createHash, randomUUID } from "node:crypto";

import {
  attachStoredObjectToDocument,
  createUploadedDocument,
  markDocumentFailed,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import {
  createIngestionEvent,
  type IngestionEvent,
} from "@/features/ingestion/domain/ingestion-event";
import {
  createIngestionJob,
  transitionIngestionJob,
  type IngestionJob,
} from "@/features/ingestion/domain/ingestion-job";
import { resolveUploadLifecyclePolicy } from "@/features/ingestion/domain/upload-lifecycle-policy";
import {
  createIngestionQueueMessage,
  type IngestionQueue,
  type IngestionQueueMessage,
} from "@/features/ingestion/queue/ingestion-queue";
import { type IngestionEventRepository } from "@/features/ingestion/repositories/ingestion-event-repository";
import { type IngestionJobRepository } from "@/features/ingestion/repositories/ingestion-job-repository";
import {
  buildStructuredLogEntry,
  serializeStructuredLogEntry,
} from "@/features/observability/lib/structured-logger";
import {
  buildObjectStorageKey,
  type ObjectStorage,
  type StoredObject,
} from "@/features/storage/lib/object-storage";

export type SubmitTabularUploadToQueueInput = {
  body: Buffer;
  contentType?: string;
  documentRepository: DocumentRepository;
  fileName: string;
  generateId?: () => string;
  ingestionEventRepository: IngestionEventRepository;
  ingestionJobRepository: IngestionJobRepository;
  log?: (message: string) => void;
  now?: () => string;
  orgId: string;
  queue: IngestionQueue;
  retainSourceFile?: boolean;
  requestId?: string;
  storage: ObjectStorage;
};

export type SubmittedTabularUpload = {
  document: DocumentRecord;
  ingestionEvent: IngestionEvent;
  ingestionJob: IngestionJob;
  isDuplicate: boolean;
  queueMessage?: IngestionQueueMessage;
  storageObject?: StoredObject;
};

export class SubmitTabularUploadToQueueError extends Error {
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
    this.name = "SubmitTabularUploadToQueueError";
  }
}

export async function submitTabularUploadToQueue(
  input: SubmitTabularUploadToQueueInput,
): Promise<SubmittedTabularUpload> {
  const now = input.now ?? (() => new Date().toISOString());
  const generateId = input.generateId ?? randomUUID;
  const emitLog = input.log ?? (() => undefined);
  const createdAt = now();
  const uploadChecksumSha256 = createBodySha256(input.body);
  const existingDocument = await input.documentRepository.findByOrgIdAndChecksum(
    input.orgId,
    uploadChecksumSha256,
  );

  if (existingDocument !== null && existingDocument.status !== "failed") {
    let latestJob = selectLatestIngestionJob(
      await input.ingestionJobRepository.listByDocumentId(existingDocument.id),
    );

    if (latestJob === null && existingDocument.status === "extracted") {
      latestJob = buildBackfilledCompletedIngestionJob(
        existingDocument,
        generateId(),
      );
      await input.ingestionJobRepository.put(latestJob);

      emitLog(
        serializeStructuredLogEntry({
          data: {
            checksumSha256: uploadChecksumSha256,
            synthesizedJobId: latestJob.id,
          },
          documentId: existingDocument.id,
          feature: "ingestion",
          jobId: latestJob.id,
          level: "info",
          message:
            "Backfilled missing ingestion job for an extracted duplicate document.",
          orgId: input.orgId,
          requestId: input.requestId,
          service: "web",
        }),
      );
    }

    if (latestJob !== null) {
      const duplicateEvent = await input.ingestionEventRepository.put(
        createIngestionEvent({
          archiveAfterDays: existingDocument.archiveAfterDays ?? 30,
          checksumSha256: uploadChecksumSha256,
          createdAt,
          deduplicated: true,
          documentId: existingDocument.id,
          fileName: existingDocument.fileName,
          id: generateId(),
          jobId: latestJob.id,
          kind: "upload.duplicate",
          metadata: {
            duplicateOfDocumentId: existingDocument.id,
          },
          orgId: input.orgId,
          retentionPolicyKey:
            existingDocument.retentionPolicyKey ?? "manual-upload-hot-30d",
          sizeBytes: existingDocument.sizeBytes ?? input.body.byteLength,
          source: existingDocument.source,
        }),
      );

      emitLog(
        serializeStructuredLogEntry({
          data: {
            checksumSha256: uploadChecksumSha256,
            duplicateOfDocumentId: existingDocument.id,
            sizeBytes: existingDocument.sizeBytes ?? input.body.byteLength,
          },
          documentId: existingDocument.id,
          feature: "ingestion",
          jobId: latestJob.id,
          level: "info",
          message: "Deduplicated repeated tabular upload.",
          orgId: input.orgId,
          requestId: input.requestId,
          service: "web",
        }),
      );

      return {
        document: existingDocument,
        ingestionEvent: duplicateEvent,
        ingestionJob: latestJob,
        isDuplicate: true,
        storageObject: existingDocument.rawObject,
      };
    }
  }

  const documentId = generateId();
  const jobId = generateId();
  const lifecyclePolicy = resolveUploadLifecyclePolicy("upload", {
    retainSourceFile: input.retainSourceFile,
  });
  let document = createUploadedDocument(
    {
      archiveAfterDays: lifecyclePolicy.archiveAfterDays,
      contentType: input.contentType,
      fileName: input.fileName,
      id: documentId,
      orgId: input.orgId,
      retentionPolicyKey: lifecyclePolicy.retentionPolicyKey,
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

  await input.documentRepository.put(document);
  await input.ingestionJobRepository.put(ingestionJob);

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
    await input.documentRepository.put(document);

    const queueMessage = createIngestionQueueMessage({
      documentId,
      enqueuedAt: now(),
      jobId,
      orgId: input.orgId,
    });

    await input.queue.enqueue(queueMessage);

    const ingestionEvent = await input.ingestionEventRepository.put(
      createIngestionEvent({
        archiveAfterDays: lifecyclePolicy.archiveAfterDays,
        checksumSha256: storageObject.sha256,
        createdAt: now(),
        deduplicated: false,
        documentId,
        fileName: input.fileName,
        id: generateId(),
        jobId,
        kind: "upload.queued",
        metadata: {
          objectKey: storageObject.key,
          queueStatus: ingestionJob.status,
        },
        orgId: input.orgId,
        retentionPolicyKey: lifecyclePolicy.retentionPolicyKey,
        sizeBytes: storageObject.sizeBytes,
        source: document.source,
      }),
    );

    emitLog(
      serializeStructuredLogEntry({
        data: {
          checksumSha256: storageObject.sha256,
          estimatedIngestCostUsd: ingestionEvent.estimatedIngestCostUsd,
          objectKey: storageObject.key,
          queuedStatus: ingestionJob.status,
          sizeBytes: storageObject.sizeBytes,
        },
        documentId,
        feature: "ingestion",
        jobId,
        level: "info",
        message: "Queued tabular upload for background processing.",
        orgId: input.orgId,
        requestId: input.requestId,
        service: "web",
      }),
    );

    return {
      document,
      ingestionEvent,
      ingestionJob,
      isDuplicate: false,
      queueMessage,
      storageObject,
    };
  } catch (error) {
    const failureMessage =
      error instanceof Error
        ? error.message
        : "Unknown queue submission failure";

    document = markDocumentFailed(document, now());
    ingestionJob = transitionIngestionJob(
      ingestionJob,
      "failed",
      now(),
      failureMessage,
    );

    await input.documentRepository.put(document);
    await input.ingestionJobRepository.put(ingestionJob);

    emitLog(
      JSON.stringify(
        buildStructuredLogEntry({
          data: {
            error: failureMessage,
            fileName: input.fileName,
          },
          documentId,
          feature: "ingestion",
          jobId,
          level: "error",
          message: "Failed to queue tabular upload.",
          orgId: input.orgId,
          requestId: input.requestId,
          service: "web",
        }),
      ),
    );

    throw new SubmitTabularUploadToQueueError(failureMessage, {
      document,
      ingestionJob,
    });
  }
}

function createBodySha256(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

function selectLatestIngestionJob(
  jobs: readonly IngestionJob[],
): IngestionJob | null {
  if (jobs.length === 0) {
    return null;
  }

  return [...jobs].sort((left, right) =>
    right.lastUpdatedAt.localeCompare(left.lastUpdatedAt),
  )[0];
}

function buildBackfilledCompletedIngestionJob(
  document: DocumentRecord,
  jobId: string,
): IngestionJob {
  let job = createIngestionJob(
    {
      documentId: document.id,
      id: jobId,
      orgId: document.orgId,
    },
    document.createdAt,
  );

  for (const status of [
    "parsing",
    "classifying",
    "extracting",
    "normalizing",
    "completed",
  ] as const) {
    job = transitionIngestionJob(job, status, document.updatedAt);
  }

  return job;
}
