import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalChunkRepository } from "@/features/chunks/repositories/local-chunk-repository";
import { createDeterministicTextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { materializeFactChunks } from "@/features/chunks/services/materialize-fact-chunks";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { materializeExtractionFacts } from "@/features/facts/services/materialize-extraction-facts";
import { planDatasetQuestion } from "@/features/query/services/query-planner";
import { retrieveFactVectorEvidence } from "@/features/query/services/fact-vector-retrieval";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("retrieveFactVectorEvidence", () => {
  it("retrieves ranked fact and chunk evidence from local repositories", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-query-retrieval-"),
    );
    temporaryDirectories.push(rootDirectory);

    const entityRepository = createLocalEntityRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const chunkRepository = createLocalChunkRepository({ rootDirectory });
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
          canonicalFactTypeId: "invoice.amount.outstanding",
          citations: [
            createCitation({
              confidenceScore: 0.94,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:invoice-outstanding",
            }),
          ],
          confidenceScore: 0.94,
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
      now: () => "2026-04-10T01:00:00.000Z",
      orgId: "org_123",
    });
    await materializeFactChunks({
      chunkRepository,
      documentId: "doc_123",
      embedder: createDeterministicTextEmbedder({ dimensions: 8 }),
      entityRepository,
      factRepository,
      now: () => "2026-04-10T01:01:00.000Z",
      orgId: "org_123",
    });

    const result = await retrieveFactVectorEvidence({
      chunkRepository,
      embedder: createDeterministicTextEmbedder({ dimensions: 8 }),
      factRepository,
      plan: planDatasetQuestion(
        "Why are overdue invoices climbing?",
        "org_123",
      ),
    });

    expect(result.facts).toHaveLength(1);
    expect(result.chunks).toHaveLength(1);
    expect(result.facts[0]?.factTypeId).toBe("invoice.amount.outstanding");
  });
});
