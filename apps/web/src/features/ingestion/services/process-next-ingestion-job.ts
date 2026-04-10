import { randomUUID } from "node:crypto";

import { type TextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { type ChunkRepository } from "@/features/chunks/repositories/chunk-repository";
import { materializeFactChunks } from "@/features/chunks/services/materialize-fact-chunks";
import { resolveUploadRouting } from "@/features/documents/domain/document-format";
import {
  detachStoredObjectFromDocument,
  markDocumentExtracted,
  markDocumentFailed,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type EntityRepository } from "@/features/entities/repositories/entity-repository";
import { type DocumentExtractionService } from "@/features/extraction/services/document-extraction-service";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { materializeExtractionFacts } from "@/features/facts/services/materialize-extraction-facts";
import {
  transitionIngestionJob,
  type IngestionJob,
} from "@/features/ingestion/domain/ingestion-job";
import {
  type IngestionQueue,
  type IngestionQueueMessage,
} from "@/features/ingestion/queue/ingestion-queue";
import { type IngestionJobRepository } from "@/features/ingestion/repositories/ingestion-job-repository";
import {
  AdvanceStoredTabularUploadError,
  advanceStoredTabularUpload,
  buildStoredTabularUploadFailureLog,
} from "@/features/ingestion/services/advance-stored-tabular-upload";
import {
  AdvanceStoredTextUploadError,
  advanceStoredTextUpload,
  buildStoredTextUploadFailureLog,
} from "@/features/ingestion/services/advance-stored-text-upload";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { type TextParserArtifact } from "@/features/parsing/domain/text-parser-artifact";
import { type ParserArtifactRepository } from "@/features/parsing/repositories/parser-artifact-repository";
import { type TextParserArtifactRepository } from "@/features/parsing/repositories/text-parser-artifact-repository";
import { shouldRetainRawUpload } from "@/features/ingestion/domain/upload-lifecycle-policy";
import { type ObjectStorage } from "@/features/storage/lib/object-storage";
import { serializeStructuredLogEntry } from "@/features/observability/lib/structured-logger";

export type ProcessedQueuedTabularUpload = {
  classification:
    | Awaited<ReturnType<typeof advanceStoredTabularUpload>>["classification"]
    | null;
  extractionContractFieldCount?: number;
  format: string;
  ingestionJob: IngestionJob;
  materializedChunkCount?: number;
  materializedFactCount?: number;
  message: IngestionQueueMessage;
  parserArtifact?: ParserArtifact;
  textParserArtifact?: TextParserArtifact;
};

type ProcessNextIngestionJobInput = {
  chunkRepository?: ChunkRepository;
  documentRepository: DocumentRepository;
  embedder?: TextEmbedder;
  entityRepository?: EntityRepository;
  factRepository?: FactRepository;
  generateId?: () => string;
  ingestionJobRepository: IngestionJobRepository;
  log?: (message: string) => void;
  now?: () => string;
  parserArtifactRepository: ParserArtifactRepository;
  queue: IngestionQueue;
  storage: ObjectStorage;
  documentExtractionService?: DocumentExtractionService;
  textParserArtifactRepository: TextParserArtifactRepository;
};

export class ProcessNextIngestionJobError extends Error {
  readonly documentId: string;
  readonly ingestionJob: IngestionJob;
  readonly jobId: string;

  constructor(
    message: string,
    state: {
      documentId: string;
      ingestionJob: IngestionJob;
      jobId: string;
    },
  ) {
    super(message);
    this.documentId = state.documentId;
    this.ingestionJob = state.ingestionJob;
    this.jobId = state.jobId;
    this.name = "ProcessNextIngestionJobError";
  }
}

export async function processNextIngestionJob(
  input: ProcessNextIngestionJobInput,
): Promise<ProcessedQueuedTabularUpload | null> {
  const now = input.now ?? (() => new Date().toISOString());
  const generateId = input.generateId ?? randomUUID;
  const emitLog = input.log ?? (() => undefined);
  const message = await input.queue.dequeue();

  if (message === null) {
    return null;
  }

  const document = await input.documentRepository.getById(message.documentId);
  const ingestionJob = await input.ingestionJobRepository.getById(
    message.jobId,
  );

  if (document === null || ingestionJob === null) {
    throw new Error(
      `Missing persisted ingestion state for queued message: ${message.jobId}`,
    );
  }

  if (document.rawObject === undefined) {
    throw new Error(
      `Document ${document.id} is missing a stored raw object for processing.`,
    );
  }

  try {
    const body = await input.storage.getObject(document.rawObject.key);
    const routing = resolveUploadRouting({
      body,
      contentType: document.contentType,
      fileName: document.fileName,
    });

    if (routing.parserRoute === "tabular") {
      const advancedUpload = await advanceStoredTabularUpload({
        body,
        document,
        generateId,
        ingestionJob,
        log: emitLog,
        now,
      });

      let documentToPersist = advancedUpload.document;
      let ingestionJobToPersist = advancedUpload.ingestionJob;
      let materializedFactCount: number | undefined;
      let materializedChunkCount: number | undefined;
      let extractionContractFieldCount: number | undefined;

      if (
        input.documentExtractionService !== undefined &&
        input.entityRepository !== undefined &&
        input.factRepository !== undefined &&
        input.chunkRepository !== undefined &&
        input.embedder !== undefined
      ) {
        const extractionContract = await input.documentExtractionService.extract({
          body,
          classification: advancedUpload.classification,
          document: advancedUpload.document,
          parserArtifact: advancedUpload.parserArtifact,
          parserRoute: "tabular",
        });

        if (extractionContract !== null) {
          const materializedFacts = await materializeExtractionFacts({
            contract: extractionContract,
            entityRepository: input.entityRepository,
            factRepository: input.factRepository,
            now,
            orgId: advancedUpload.document.orgId,
          });
          const materializedChunks = await materializeFactChunks({
            chunkRepository: input.chunkRepository,
            documentId: advancedUpload.document.id,
            embedder: input.embedder,
            entityRepository: input.entityRepository,
            factRepository: input.factRepository,
            now,
            orgId: advancedUpload.document.orgId,
          });

          extractionContractFieldCount = extractionContract.fields.length;
          materializedChunkCount = materializedChunks.chunkCount;
          materializedFactCount = materializedFacts.facts.length;
          documentToPersist = markDocumentExtracted(advancedUpload.document, now());
          ingestionJobToPersist = transitionIngestionJob(
            advancedUpload.ingestionJob,
            "normalizing",
            now(),
          );
          ingestionJobToPersist = transitionIngestionJob(
            ingestionJobToPersist,
            "completed",
            now(),
          );

          emitLog(
            serializeStructuredLogEntry({
              data: {
                extractionContractFieldCount,
                materializedChunkCount,
                materializedFactCount,
                modelSource: "openai-responses",
              },
              documentId: documentToPersist.id,
              feature: "extraction",
              jobId: ingestionJobToPersist.id,
              level: "info",
              message:
                "Materialized canonical facts and retrieval chunks from extracted document content.",
              orgId: documentToPersist.orgId,
              service: "web",
            }),
          );
        }
      }

      documentToPersist = await maybePurgeStoredRawUpload({
        document: documentToPersist,
        isProcessingComplete:
          documentToPersist.status === "extracted" ||
          ingestionJobToPersist.status === "completed",
        jobId: ingestionJobToPersist.id,
        log: emitLog,
        storage: input.storage,
      });

      await input.documentRepository.put(documentToPersist);
      await input.ingestionJobRepository.put(ingestionJobToPersist);
      await input.parserArtifactRepository.put(advancedUpload.parserArtifact);

      return {
        classification: advancedUpload.classification,
        extractionContractFieldCount,
        format: routing.format,
        ingestionJob: ingestionJobToPersist,
        materializedChunkCount,
        materializedFactCount,
        message,
        parserArtifact: advancedUpload.parserArtifact,
      };
    }

    const advancedTextUpload = await advanceStoredTextUpload({
      body,
      document,
      generateId,
      ingestionJob,
      log: emitLog,
      now,
    });

    let documentToPersist = advancedTextUpload.document;
    let ingestionJobToPersist = advancedTextUpload.ingestionJob;
    let materializedFactCount: number | undefined;
    let materializedChunkCount: number | undefined;
    let extractionContractFieldCount: number | undefined;

    if (
      input.documentExtractionService !== undefined &&
      input.entityRepository !== undefined &&
      input.factRepository !== undefined &&
      input.chunkRepository !== undefined &&
      input.embedder !== undefined
    ) {
      const extractionContract = await input.documentExtractionService.extract({
        body,
        document: advancedTextUpload.document,
        parserRoute: "text",
        textParserArtifact: advancedTextUpload.textParserArtifact,
      });

      if (extractionContract !== null) {
        const materializedFacts = await materializeExtractionFacts({
          contract: extractionContract,
          entityRepository: input.entityRepository,
          factRepository: input.factRepository,
          now,
          orgId: advancedTextUpload.document.orgId,
        });
        const materializedChunks = await materializeFactChunks({
          chunkRepository: input.chunkRepository,
          documentId: advancedTextUpload.document.id,
          embedder: input.embedder,
          entityRepository: input.entityRepository,
          factRepository: input.factRepository,
          now,
          orgId: advancedTextUpload.document.orgId,
        });

        extractionContractFieldCount = extractionContract.fields.length;
        materializedChunkCount = materializedChunks.chunkCount;
        materializedFactCount = materializedFacts.facts.length;
        documentToPersist = markDocumentExtracted(advancedTextUpload.document, now());
        ingestionJobToPersist = advancedTextUpload.ingestionJob;

        emitLog(
          serializeStructuredLogEntry({
            data: {
              extractionContractFieldCount,
              materializedChunkCount,
              materializedFactCount,
              modelSource: "openai-responses",
            },
            documentId: documentToPersist.id,
            feature: "extraction",
            jobId: ingestionJobToPersist.id,
            level: "info",
            message:
              "Materialized canonical facts and retrieval chunks from extracted document content.",
            orgId: documentToPersist.orgId,
            service: "web",
          }),
        );
      }
    }

    documentToPersist = await maybePurgeStoredRawUpload({
      document: documentToPersist,
      isProcessingComplete:
        documentToPersist.status === "extracted" ||
        ingestionJobToPersist.status === "completed",
      jobId: ingestionJobToPersist.id,
      log: emitLog,
      storage: input.storage,
    });

    await input.documentRepository.put(documentToPersist);
    await input.ingestionJobRepository.put(ingestionJobToPersist);
    await input.textParserArtifactRepository.put(
      advancedTextUpload.textParserArtifact,
    );

    return {
      classification: null,
      extractionContractFieldCount,
      format: routing.format,
      ingestionJob: ingestionJobToPersist,
      materializedChunkCount,
      materializedFactCount,
      message,
      textParserArtifact: advancedTextUpload.textParserArtifact,
    };
  } catch (error) {
    const failureMessage =
      error instanceof Error ? error.message : "Unknown ingestion failure";
    const failedState =
      error instanceof AdvanceStoredTabularUploadError
        ? {
            document: error.document,
            ingestionJob: error.ingestionJob,
          }
        : {
            document: markDocumentFailed(document, now()),
            ingestionJob: transitionIngestionJob(
              ingestionJob,
              "failed",
              now(),
              failureMessage,
            ),
          };

    await input.documentRepository.put(failedState.document);
    await input.ingestionJobRepository.put(failedState.ingestionJob);
    emitLog(
      error instanceof AdvanceStoredTextUploadError
        ? buildStoredTextUploadFailureLog({
            document: failedState.document,
            failureMessage,
            ingestionJob: failedState.ingestionJob,
          })
        : buildStoredTabularUploadFailureLog({
            document: failedState.document,
            failureMessage,
            ingestionJob: failedState.ingestionJob,
          }),
    );

    throw new ProcessNextIngestionJobError(failureMessage, {
      documentId: failedState.document.id,
      ingestionJob: failedState.ingestionJob,
      jobId: failedState.ingestionJob.id,
    });
  }
}

async function maybePurgeStoredRawUpload(input: Readonly<{
  document: DocumentRecord;
  isProcessingComplete: boolean;
  jobId: string;
  log: (message: string) => void;
  storage: ObjectStorage;
}>): Promise<DocumentRecord> {
  if (
    !input.isProcessingComplete ||
    input.document.rawObject === undefined ||
    shouldRetainRawUpload(input.document.retentionPolicyKey)
  ) {
    return input.document;
  }

  try {
    await input.storage.deleteObject(input.document.rawObject.key);

    input.log(
      serializeStructuredLogEntry({
        data: {
          retentionPolicyKey: input.document.retentionPolicyKey,
        },
        documentId: input.document.id,
        feature: "ingestion",
        jobId: input.jobId,
        level: "info",
        message: "Purged raw upload after successful processing.",
        orgId: input.document.orgId,
        service: "web",
      }),
    );

    return detachStoredObjectFromDocument(input.document);
  } catch (error) {
    input.log(
      serializeStructuredLogEntry({
        data: {
          error:
            error instanceof Error ? error.message : "Unknown storage deletion error",
          retentionPolicyKey: input.document.retentionPolicyKey,
        },
        documentId: input.document.id,
        exception:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                type: error.name,
              }
            : undefined,
        feature: "ingestion",
        jobId: input.jobId,
        level: "warn",
        message: "Could not purge processed raw upload from storage.",
        orgId: input.document.orgId,
        service: "web",
      }),
    );

    return input.document;
  }
}
