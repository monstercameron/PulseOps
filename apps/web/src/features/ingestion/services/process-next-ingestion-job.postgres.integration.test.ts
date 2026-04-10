import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDeterministicTextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { createPostgresChunkRepository } from "@/features/chunks/repositories/postgres-chunk-repository";
import { resolveServerPaths } from "@/features/config/server-env";
import { createPostgresDocumentRepository } from "@/features/documents/repositories/postgres-document-repository";
import { createPostgresEntityRepository } from "@/features/entities/repositories/postgres-entity-repository";
import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { createPostgresFactRepository } from "@/features/facts/repositories/postgres-fact-repository";
import { createInMemoryIngestionQueue } from "@/features/ingestion/queue/in-memory-ingestion-queue";
import { createPostgresIngestionEventRepository } from "@/features/ingestion/repositories/postgres-ingestion-event-repository";
import { createPostgresIngestionJobRepository } from "@/features/ingestion/repositories/postgres-ingestion-job-repository";
import {
  processNextIngestionJob,
} from "@/features/ingestion/services/process-next-ingestion-job";
import { submitTabularUploadToQueue } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { readCuratedAssetDocument } from "@/features/ingestion/testing/asset-documents";
import { createPostgresParserArtifactRepository } from "@/features/parsing/repositories/postgres-parser-artifact-repository";
import { createPostgresTextParserArtifactRepository } from "@/features/parsing/repositories/postgres-text-parser-artifact-repository";
import { getPostgresPool } from "@/features/persistence/postgres/postgres-pool";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";
import { createCitation } from "@/features/trust/domain/citation";

const shouldRunPostgresIntegration =
  process.env.BIZOPS_ENABLE_POSTGRES_TESTS === "1";
const temporaryDirectories: string[] = [];
const cleanupOrgIds: string[] = [];
const serverPaths = resolveServerPaths({
  ...process.env,
  NODE_ENV: "development",
});
const postgresPool = getPostgresPool(serverPaths.databaseUrl);

afterEach(async () => {
  while (cleanupOrgIds.length > 0) {
    const orgId = cleanupOrgIds.pop();

    if (orgId !== undefined) {
      await cleanupPostgresOrg(orgId);
    }
  }

  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const describePostgres = shouldRunPostgresIntegration ? describe : describe.skip;

describePostgres("processNextIngestionJob postgres integration", () => {
  beforeAll(async () => {
    await postgresPool.query("select 1");
  });

  it("persists extracted facts and pgvector-backed chunks for asset uploads", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-postgres-process-"),
    );
    temporaryDirectories.push(rootDirectory);

    const orgId = `org_pg_${randomUUID().replace(/-/g, "")}`;
    cleanupOrgIds.push(orgId);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T22:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const queue = createInMemoryIngestionQueue();
    const body = await readCuratedAssetDocument("10020Records.csv");
    const documentRepository = createPostgresDocumentRepository({
      pool: postgresPool,
    });
    const chunkRepository = createPostgresChunkRepository({
      pool: postgresPool,
    });
    const factRepository = createPostgresFactRepository({
      pool: postgresPool,
    });
    const entityRepository = createPostgresEntityRepository({
      pool: postgresPool,
    });
    const ingestionEventRepository = createPostgresIngestionEventRepository({
      pool: postgresPool,
    });
    const ingestionJobRepository = createPostgresIngestionJobRepository({
      pool: postgresPool,
    });
    const parserArtifactRepository = createPostgresParserArtifactRepository({
      pool: postgresPool,
    });
    const textParserArtifactRepository =
      createPostgresTextParserArtifactRepository({
        pool: postgresPool,
      });

    const submittedUpload = await submitTabularUploadToQueue({
      body,
      documentRepository,
      fileName: "10020Records.csv",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T22:00:00.000Z",
      orgId,
      queue,
      storage,
    });

    const processedUpload = await processNextIngestionJob({
      chunkRepository,
      documentRepository,
      documentExtractionService: {
        extract: async ({ document, parserRoute }) =>
          createExtractionContract({
            createdAt: "2026-04-09T22:00:01.000Z",
            documentFamily: "generic-business-document",
            documentId: document.id,
            fields:
              parserRoute !== "tabular"
                ? []
                : [
                    {
                      citations: [
                        createCitation({
                          confidenceScore: 0.9,
                          documentFamily: "generic-business-document",
                          documentId: document.id,
                          locator: {
                            row: 2,
                            sheet: "Sheet1",
                          },
                          locatorType: "cell",
                          sourceHash: "sha256:asset-profit-sample",
                        }),
                      ],
                      confidenceScore: 0.9,
                      key: "sheet1.row_2.sample_profit",
                      label: "Sample profit",
                      value: 230934.0,
                      canonicalFactTypeId: "document.observation.number",
                    },
                  ],
          }),
      },
      embedder: createDeterministicTextEmbedder({
        dimensions: 8,
      }),
      entityRepository,
      factRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T22:00:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      textParserArtifactRepository,
    });

    expect(submittedUpload.isDuplicate).toBe(false);
    expect(processedUpload?.ingestionJob.status).toBe("completed");
    expect(processedUpload?.materializedFactCount).toBe(1);
    expect(processedUpload?.materializedChunkCount).toBe(1);

    const persistedDocument = await documentRepository.getById(
      submittedUpload.document.id,
    );
    const persistedFacts = await factRepository.listByDocumentId(
      submittedUpload.document.id,
    );
    const persistedChunks = await chunkRepository.listByDocumentId(
      submittedUpload.document.id,
    );
    const vectorCheck = await postgresPool.query<{
      content: string;
      dims: number;
    }>(
      `
        select
          content,
          vector_dims(embedding_vector) as dims
        from retrieval_chunks
        where document_id = $1
      `,
      [submittedUpload.document.id],
    );

    expect(persistedDocument).toMatchObject({
      id: submittedUpload.document.id,
      orgId,
      status: "extracted",
    });
    expect(persistedFacts).toMatchObject([
      {
        canonicalFactTypeId: "document.observation.number",
        documentId: submittedUpload.document.id,
        label: "Sample profit",
      },
    ]);
    expect(persistedChunks).toMatchObject([
      {
        content: expect.stringContaining("Sample profit: 230934"),
        documentId: submittedUpload.document.id,
      },
    ]);
    expect(vectorCheck.rows).toMatchObject([
      {
        content: expect.stringContaining("Sample profit: 230934"),
        dims: 8,
      },
    ]);
  });
});

async function cleanupPostgresOrg(orgId: string) {
  await postgresPool.query("delete from retrieval_chunks where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from canonical_facts where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from entities where org_id = $1", [orgId]);
  await postgresPool.query(
    "delete from parser_artifacts where document_id in (select id from documents where org_id = $1)",
    [orgId],
  );
  await postgresPool.query(
    "delete from text_parser_artifacts where document_id in (select id from documents where org_id = $1)",
    [orgId],
  );
  await postgresPool.query("delete from ingestion_events where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from ingestion_jobs where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from documents where org_id = $1", [orgId]);
}
