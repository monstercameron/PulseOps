import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { createDeterministicTextEmbedder } from "../apps/web/src/features/chunks/lib/deterministic-embedder";
import { createPostgresChunkRepository } from "../apps/web/src/features/chunks/repositories/postgres-chunk-repository";
import { resolveServerPaths } from "../apps/web/src/features/config/server-env";
import { createPostgresDocumentRepository } from "../apps/web/src/features/documents/repositories/postgres-document-repository";
import { createPostgresEntityRepository } from "../apps/web/src/features/entities/repositories/postgres-entity-repository";
import { createOpenAiDocumentExtractionServiceFromEnv } from "../apps/web/src/features/extraction/services/openai-document-extraction-service";
import { createPostgresFactRepository } from "../apps/web/src/features/facts/repositories/postgres-fact-repository";
import { createInMemoryIngestionQueue } from "../apps/web/src/features/ingestion/queue/in-memory-ingestion-queue";
import { createPostgresIngestionEventRepository } from "../apps/web/src/features/ingestion/repositories/postgres-ingestion-event-repository";
import { createPostgresIngestionJobRepository } from "../apps/web/src/features/ingestion/repositories/postgres-ingestion-job-repository";
import { processNextIngestionJob } from "../apps/web/src/features/ingestion/services/process-next-ingestion-job";
import { submitTabularUploadToQueue } from "../apps/web/src/features/ingestion/services/submit-tabular-upload-to-queue";
import { readCuratedAssetDocument } from "../apps/web/src/features/ingestion/testing/asset-documents";
import { createPostgresParserArtifactRepository } from "../apps/web/src/features/parsing/repositories/postgres-parser-artifact-repository";
import { createPostgresTextParserArtifactRepository } from "../apps/web/src/features/parsing/repositories/postgres-text-parser-artifact-repository";
import { getPostgresPool } from "../apps/web/src/features/persistence/postgres/postgres-pool";
import { createLocalObjectStorage } from "../apps/web/src/features/storage/lib/local-object-storage";

async function main() {
  const serverPaths = resolveServerPaths({
    ...process.env,
    NODE_ENV: "development",
  });
  const pool = getPostgresPool(serverPaths.databaseUrl);
  const extractionService = createOpenAiDocumentExtractionServiceFromEnv(
    process.env,
  );

  if (extractionService === null) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const rootDirectory = await mkdtemp(
    path.join(os.tmpdir(), "bizops-live-openai-postgres-"),
  );
  const orgId = `org_live_${randomUUID().replace(/-/g, "")}`;
  const queue = createInMemoryIngestionQueue();
  const storage = createLocalObjectStorage({
    now: () => "2026-04-09T22:30:00.000Z",
    rootDirectory: path.join(rootDirectory, "storage"),
  });
  const body = await readCuratedAssetDocument("10020Records.csv");
  const documentRepository = createPostgresDocumentRepository({
    pool,
  });
  const chunkRepository = createPostgresChunkRepository({
    pool,
  });
  const entityRepository = createPostgresEntityRepository({
    pool,
  });
  const factRepository = createPostgresFactRepository({
    pool,
  });
  const ingestionEventRepository = createPostgresIngestionEventRepository({
    pool,
  });
  const ingestionJobRepository = createPostgresIngestionJobRepository({
    pool,
  });
  const parserArtifactRepository = createPostgresParserArtifactRepository({
    pool,
  });
  const textParserArtifactRepository =
    createPostgresTextParserArtifactRepository({
      pool,
    });

  try {
    const submitted = await submitTabularUploadToQueue({
      body,
      documentRepository,
      fileName: "10020Records.csv",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T22:30:00.000Z",
      orgId,
      queue,
      storage,
    });

    const processed = await processNextIngestionJob({
      chunkRepository,
      documentRepository,
      documentExtractionService: extractionService,
      embedder: createDeterministicTextEmbedder({
        dimensions: 8,
      }),
      entityRepository,
      factRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T22:30:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      textParserArtifactRepository,
    });

    const facts = await factRepository.listByDocumentId(submitted.document.id);
    const chunks = await chunkRepository.listByDocumentId(submitted.document.id);
    const vectorCheck = await pool.query<{
      dims: number;
    }>(
      "select vector_dims(embedding_vector) as dims from retrieval_chunks where document_id = $1",
      [submitted.document.id],
    );

    console.log(
      JSON.stringify(
        {
          chunkCount: chunks.length,
          documentId: submitted.document.id,
          extractionContractFieldCount:
            processed?.extractionContractFieldCount ?? null,
          factCount: facts.length,
          format: processed?.format ?? null,
          materializedChunkCount: processed?.materializedChunkCount ?? null,
          materializedFactCount: processed?.materializedFactCount ?? null,
          sampleFactLabels: facts
            .slice(0, 5)
            .map((fact) => fact.label ?? fact.canonicalFactTypeId),
          status: processed?.ingestionJob.status ?? null,
          vectorDimensions: vectorCheck.rows[0]?.dims ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.query("delete from retrieval_chunks where org_id = $1", [orgId]);
    await pool.query("delete from canonical_facts where org_id = $1", [orgId]);
    await pool.query("delete from entities where org_id = $1", [orgId]);
    await pool.query(
      "delete from parser_artifacts where document_id in (select id from documents where org_id = $1)",
      [orgId],
    );
    await pool.query(
      "delete from text_parser_artifacts where document_id in (select id from documents where org_id = $1)",
      [orgId],
    );
    await pool.query("delete from ingestion_events where org_id = $1", [orgId]);
    await pool.query("delete from ingestion_jobs where org_id = $1", [orgId]);
    await pool.query("delete from documents where org_id = $1", [orgId]);
    await rm(rootDirectory, { force: true, recursive: true });
  }
}

void main();
