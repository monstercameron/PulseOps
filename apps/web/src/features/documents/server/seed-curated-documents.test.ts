import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createLocalParserArtifactRepository } from "@/features/parsing/repositories/local-parser-artifact-repository";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("ensureCuratedDocumentsSeeded", () => {
  it("seeds curated asset documents with deterministic facts and objects", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-seed-documents-"),
    );
    const storageRoot = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-seed-storage-"),
    );
    temporaryDirectories.push(rootDirectory, storageRoot);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const entityRepository = createLocalEntityRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const parserArtifactRepository = createLocalParserArtifactRepository({
      rootDirectory,
    });
    const storage = createLocalObjectStorage({ rootDirectory: storageRoot });

    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed",
      parserArtifactRepository,
      storage,
    });
    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed",
      parserArtifactRepository,
      storage,
    });

    const documents = await documentRepository.listByOrgId("org_seed");
    const entities = await entityRepository.listByOrgId("org_seed");
    const facts = await factRepository.listByOrgId("org_seed");
    const parserArtifacts = await Promise.all(
      documents.map((document) =>
        document.parserArtifactId === undefined
          ? Promise.resolve(null)
          : parserArtifactRepository.getById(document.parserArtifactId),
      ),
    );
    const salesDocument = documents.find(
      (document) => document.fileName === "10020Records.csv",
    );
    const invoiceDocument = documents.find(
      (document) => document.fileName === "field-service-customer-invoice.csv",
    );
    const jobCostDocument = documents.find(
      (document) => document.fileName === "field-service-job-cost-report.csv",
    );
    const supermarketDocument = documents.find(
      (document) => document.fileName === "supermarket_sales - Sheet1.csv",
    );
    const vendorBillDocument = documents.find(
      (document) => document.fileName === "field-service-vendor-bill.csv",
    );

    expect(documents).toHaveLength(5);
    expect(entities).toHaveLength(5);
    expect(facts).toHaveLength(9);
    expect(documents.map((document) => document.fileName).sort()).toStrictEqual(
      [
        "10020Records.csv",
        "field-service-customer-invoice.csv",
        "field-service-job-cost-report.csv",
        "field-service-vendor-bill.csv",
        "supermarket_sales - Sheet1.csv",
      ],
    );
    expect(
      documents.every(
        (document) =>
          document.status === "extracted" &&
          document.parserArtifactId !== undefined &&
          document.rawObject !== undefined &&
          document.checksumSha256 !== undefined,
      ),
    ).toBe(true);
    expect(
      parserArtifacts.filter((artifact) => artifact !== null),
    ).toHaveLength(5);
    expect(
      salesDocument &&
        (await storage.exists(salesDocument.rawObject?.key ?? "missing")),
    ).toBe(true);
    expect(
      invoiceDocument &&
        (await storage.exists(invoiceDocument.rawObject?.key ?? "missing")),
    ).toBe(true);
    expect(
      jobCostDocument &&
        (await storage.exists(jobCostDocument.rawObject?.key ?? "missing")),
    ).toBe(true);
    expect(
      supermarketDocument &&
        (await storage.exists(supermarketDocument.rawObject?.key ?? "missing")),
    ).toBe(true);
    expect(
      vendorBillDocument &&
        (await storage.exists(vendorBillDocument.rawObject?.key ?? "missing")),
    ).toBe(true);
    expect(invoiceDocument?.suggestedDocumentFamily).toBe("customer-invoice");
    expect(jobCostDocument?.suggestedDocumentFamily).toBe("job-cost-report");
    expect(vendorBillDocument?.suggestedDocumentFamily).toBe("vendor-bill");
    expect(
      facts
        .filter((fact) => fact.documentId === salesDocument?.id)
        .map((fact) => ({
          label: fact.label,
          value: fact.value,
        })),
    ).toEqual(
      expect.arrayContaining([
        { label: "Rows parsed", value: 100 },
        { label: "Total profit", value: 44168198.4 },
      ]),
    );
    expect(
      facts
        .filter((fact) => fact.documentId === supermarketDocument?.id)
        .map((fact) => ({
          label: fact.label,
          value: fact.value,
        })),
    ).toEqual(expect.arrayContaining([{ label: "Rows parsed", value: 1000 }]));
  });

  it("deduplicates concurrent seed requests for the same org", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-seed-concurrent-"),
    );
    const storageRoot = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-seed-concurrent-storage-"),
    );
    temporaryDirectories.push(rootDirectory, storageRoot);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const entityRepository = createLocalEntityRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const parserArtifactRepository = createLocalParserArtifactRepository({
      rootDirectory,
    });
    const baseStorage = createLocalObjectStorage({
      rootDirectory: storageRoot,
    });
    let putObjectCount = 0;
    let releaseBlockedPutObject: (() => void) | undefined;
    const blockFirstPutObject = new Promise<void>((resolve) => {
      releaseBlockedPutObject = resolve;
    });
    const storage = {
      ...baseStorage,
      async putObject(input: Parameters<typeof baseStorage.putObject>[0]) {
        putObjectCount += 1;

        if (putObjectCount === 1) {
          await blockFirstPutObject;
        }

        return baseStorage.putObject(input);
      },
    };

    const firstRequest = ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed_concurrent",
      parserArtifactRepository,
      storage,
    });
    const secondRequest = ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed_concurrent",
      parserArtifactRepository,
      storage,
    });

    for (let attempt = 0; attempt < 50 && putObjectCount === 0; attempt += 1) {
      await delay(10);
    }

    expect(putObjectCount).toBe(1);
    releaseBlockedPutObject?.();

    await Promise.all([firstRequest, secondRequest]);

    expect(putObjectCount).toBe(5);
    await expect(
      documentRepository.listByOrgId("org_seed_concurrent"),
    ).resolves.toHaveLength(5);
    await expect(
      factRepository.listByOrgId("org_seed_concurrent"),
    ).resolves.toHaveLength(9);
  });

  it("writes each seeded document before its parser artifact", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-seed-order-"),
    );
    const storageRoot = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-seed-order-storage-"),
    );
    temporaryDirectories.push(rootDirectory, storageRoot);

    const operationLog: string[] = [];
    const baseDocumentRepository = createLocalDocumentRepository({
      rootDirectory,
    });
    const documentRepository = {
      ...baseDocumentRepository,
      async put(document: Parameters<typeof baseDocumentRepository.put>[0]) {
        operationLog.push(`document:${document.id}`);
        return baseDocumentRepository.put(document);
      },
    };
    const entityRepository = createLocalEntityRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const baseParserArtifactRepository = createLocalParserArtifactRepository({
      rootDirectory,
    });
    const parserArtifactRepository = {
      ...baseParserArtifactRepository,
      async put(
        parserArtifact: Parameters<typeof baseParserArtifactRepository.put>[0],
      ) {
        operationLog.push(`parser:${parserArtifact.documentId}`);
        return baseParserArtifactRepository.put(parserArtifact);
      },
    };
    const storage = createLocalObjectStorage({ rootDirectory: storageRoot });

    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed_order",
      parserArtifactRepository,
      storage,
    });

    const documents = await documentRepository.listByOrgId("org_seed_order");

    for (const document of documents) {
      expect(operationLog.indexOf(`document:${document.id}`)).toBeGreaterThan(
        -1,
      );
      expect(operationLog.indexOf(`parser:${document.id}`)).toBeGreaterThan(-1);
      expect(operationLog.indexOf(`document:${document.id}`)).toBeLessThan(
        operationLog.indexOf(`parser:${document.id}`),
      );
    }
  });
});
