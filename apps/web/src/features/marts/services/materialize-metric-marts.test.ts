import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createLocalMartRepository } from "@/features/marts/repositories/local-mart-repository";
import { materializeMetricMarts } from "@/features/marts/services/materialize-metric-marts";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("materializeMetricMarts", () => {
  it("builds persisted marts from canonical facts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-marts-"),
    );
    temporaryDirectories.push(rootDirectory);

    const factRepository = createLocalFactRepository({ rootDirectory });
    const martRepository = createLocalMartRepository({ rootDirectory });
    const citation = createCitation({
      confidenceScore: 0.94,
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      locator: { row: 2 },
      locatorType: "row",
      sourceHash: "sha256:fact",
    });

    await factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: "invoice.amount.outstanding",
        citations: [citation],
        confidenceScore: 0.94,
        createdAt: "2026-04-10T02:00:00.000Z",
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        entityId: "entity_org_123_invoice_inv-001",
        entityType: "invoice",
        orgId: "org_123",
        sourceFieldKey: "amount_outstanding",
        value: 2100,
      }),
    );
    await factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: "invoice.payment_days_late",
        citations: [citation],
        confidenceScore: 0.91,
        createdAt: "2026-04-10T02:00:00.000Z",
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        entityId: "entity_org_123_invoice_inv-001",
        entityType: "invoice",
        orgId: "org_123",
        sourceFieldKey: "payment_days_late",
        value: 12,
      }),
    );

    const marts = await materializeMetricMarts({
      asOfDate: "2026-04-10",
      factRepository,
      martRepository,
      now: () => "2026-04-10T02:01:00.000Z",
      orgId: "org_123",
    });

    expect(marts).toHaveLength(2);
    expect(await martRepository.listByOrgId("org_123")).toHaveLength(2);
  });
});
