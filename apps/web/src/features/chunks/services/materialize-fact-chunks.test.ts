import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalChunkRepository } from "@/features/chunks/repositories/local-chunk-repository";
import { createDeterministicTextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { materializeExtractionFacts } from "@/features/facts/services/materialize-extraction-facts";
import { materializeFactChunks } from "@/features/chunks/services/materialize-fact-chunks";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("materializeFactChunks", () => {
  it("builds and persists embedded chunks from materialized canonical facts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-chunks-"),
    );
    temporaryDirectories.push(rootDirectory);

    const entityRepository = createLocalEntityRepository({
      rootDirectory,
    });
    const factRepository = createLocalFactRepository({
      rootDirectory,
    });
    const chunkRepository = createLocalChunkRepository({
      rootDirectory,
    });
    const contract = createExtractionContract({
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      fields: [
        {
          citations: [
            createCitation({
              confidenceScore: 0.93,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:invoice-number",
            }),
          ],
          confidenceScore: 0.93,
          key: "invoice_number",
          label: "Invoice number",
          value: "INV-001",
        },
        {
          canonicalFactTypeId: "invoice.amount.total",
          citations: [
            createCitation({
              confidenceScore: 0.94,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:invoice-total",
            }),
          ],
          confidenceScore: 0.94,
          key: "invoice_total",
          label: "Invoice total",
          value: 4200,
        },
        {
          canonicalFactTypeId: "invoice.amount.outstanding",
          citations: [
            createCitation({
              confidenceScore: 0.95,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:amount-outstanding",
            }),
          ],
          confidenceScore: 0.95,
          key: "amount_outstanding",
          label: "Amount outstanding",
          value: 2100,
        },
      ],
    });

    await materializeExtractionFacts({
      contract,
      entityRepository,
      factRepository,
      now: () => "2026-04-09T22:30:00.000Z",
      orgId: "org_123",
    });

    const result = await materializeFactChunks({
      chunkRepository,
      documentId: "doc_123",
      embedder: createDeterministicTextEmbedder({
        dimensions: 8,
      }),
      entityRepository,
      factRepository,
      now: () => "2026-04-09T22:31:00.000Z",
      orgId: "org_123",
    });

    expect(result.chunkCount).toBe(1);
    expect(result.chunks[0]).toMatchObject({
      canonicalFactTypeIds: [
        "invoice.amount.outstanding",
        "invoice.amount.total",
      ],
      documentId: "doc_123",
      embeddingDimensions: 8,
      embeddingModel: "deterministic-text-v1",
    });
    expect(await chunkRepository.listByDocumentId("doc_123")).toHaveLength(1);
  });

  it("stays idempotent for repeated chunk materialization", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-chunks-idempotent-"),
    );
    temporaryDirectories.push(rootDirectory);

    const entityRepository = createLocalEntityRepository({
      rootDirectory,
    });
    const factRepository = createLocalFactRepository({
      rootDirectory,
    });
    const chunkRepository = createLocalChunkRepository({
      rootDirectory,
    });
    const contract = createExtractionContract({
      documentFamily: "job-cost-report",
      documentId: "doc_456",
      fields: [
        {
          canonicalFactTypeId: "job.margin.gross",
          citations: [
            createCitation({
              confidenceScore: 0.91,
              documentFamily: "job-cost-report",
              documentId: "doc_456",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:job-margin",
            }),
          ],
          confidenceScore: 0.91,
          key: "gross_margin",
          label: "Gross margin",
          value: 1180,
        },
      ],
    });

    await materializeExtractionFacts({
      contract,
      entityRepository,
      factRepository,
      now: () => "2026-04-09T22:40:00.000Z",
      orgId: "org_123",
    });

    const embedder = createDeterministicTextEmbedder({
      dimensions: 8,
    });

    await materializeFactChunks({
      chunkRepository,
      documentId: "doc_456",
      embedder,
      entityRepository,
      factRepository,
      now: () => "2026-04-09T22:41:00.000Z",
      orgId: "org_123",
    });
    await materializeFactChunks({
      chunkRepository,
      documentId: "doc_456",
      embedder,
      entityRepository,
      factRepository,
      now: () => "2026-04-09T22:42:00.000Z",
      orgId: "org_123",
    });

    expect(await chunkRepository.listByDocumentId("doc_456")).toHaveLength(1);
  });
});
