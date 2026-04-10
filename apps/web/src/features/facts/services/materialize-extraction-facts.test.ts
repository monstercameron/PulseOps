import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { materializeExtractionFacts } from "@/features/facts/services/materialize-extraction-facts";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("materializeExtractionFacts", () => {
  it("persists canonical entities and fact records from extraction contracts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-facts-"),
    );
    temporaryDirectories.push(rootDirectory);

    const entityRepository = createLocalEntityRepository({
      rootDirectory,
    });
    const factRepository = createLocalFactRepository({
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

    const result = await materializeExtractionFacts({
      contract,
      entityRepository,
      factRepository,
      now: () => "2026-04-09T21:00:00.000Z",
      orgId: "org_123",
    });

    expect(result.entities).toHaveLength(1);
    expect(result.facts).toHaveLength(2);
    expect(result.skippedFieldCount).toBe(1);
    expect(await entityRepository.listByOrgId("org_123")).toMatchObject([
      {
        canonicalKey: "inv-001",
        entityType: "invoice",
      },
    ]);
    expect(await factRepository.listByDocumentId("doc_123")).toMatchObject([
      {
        canonicalFactTypeId: "invoice.amount.total",
        entityType: "invoice",
      },
      {
        canonicalFactTypeId: "invoice.amount.outstanding",
        entityType: "invoice",
      },
    ]);
  });

  it("stays idempotent for repeated materialization of the same contract", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-facts-idempotent-"),
    );
    temporaryDirectories.push(rootDirectory);

    const entityRepository = createLocalEntityRepository({
      rootDirectory,
    });
    const factRepository = createLocalFactRepository({
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
      now: () => "2026-04-09T21:10:00.000Z",
      orgId: "org_123",
    });
    await materializeExtractionFacts({
      contract,
      entityRepository,
      factRepository,
      now: () => "2026-04-09T21:15:00.000Z",
      orgId: "org_123",
    });

    expect(await entityRepository.listByOrgId("org_123")).toHaveLength(1);
    expect(await factRepository.listByDocumentId("doc_456")).toHaveLength(1);
  });
});
