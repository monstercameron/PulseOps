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
import { createLocalSavedQuestionRepository } from "@/features/query/repositories/local-saved-question-repository";
import { handleAskRequest } from "@/features/query/server/handle-ask-request";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleAskRequest", () => {
  it("answers a dataset question and optionally saves it", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-ask-request-"),
    );
    temporaryDirectories.push(rootDirectory);

    const entityRepository = createLocalEntityRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const chunkRepository = createLocalChunkRepository({ rootDirectory });
    const savedQuestionRepository = createLocalSavedQuestionRepository({
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
      now: () => "2026-04-10T01:20:00.000Z",
      orgId: "org_123",
    });
    await materializeFactChunks({
      chunkRepository,
      documentId: "doc_123",
      embedder: createDeterministicTextEmbedder({ dimensions: 8 }),
      entityRepository,
      factRepository,
      now: () => "2026-04-10T01:21:00.000Z",
      orgId: "org_123",
    });

    const response = await handleAskRequest(
      new Request("http://localhost/api/ask", {
        body: JSON.stringify({
          orgId: "org_123",
          question: "Why are overdue invoices climbing?",
          saveQuestion: true,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        chunkRepository,
        embedder: createDeterministicTextEmbedder({ dimensions: 8 }),
        factRepository,
        generateId: () => "saved_question_123",
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      answer: {
        status: "answered",
      },
      plan: {
        retrievalMode: "hybrid",
      },
    });
    expect(await savedQuestionRepository.listByOrgId("org_123")).toHaveLength(
      1,
    );
  });
});
