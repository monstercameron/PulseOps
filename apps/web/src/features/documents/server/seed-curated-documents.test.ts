import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
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
  it("seeds two curated asset documents with deterministic facts and objects", async () => {
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
    const storage = createLocalObjectStorage({ rootDirectory: storageRoot });

    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed",
      storage,
    });
    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed",
      storage,
    });

    const documents = await documentRepository.listByOrgId("org_seed");
    const entities = await entityRepository.listByOrgId("org_seed");
    const facts = await factRepository.listByOrgId("org_seed");
    const salesDocument = documents.find(
      (document) => document.fileName === "10020Records.csv",
    );
    const supermarketDocument = documents.find(
      (document) => document.fileName === "supermarket_sales - Sheet1.csv",
    );

    expect(documents).toHaveLength(2);
    expect(entities).toHaveLength(2);
    expect(facts).toHaveLength(6);
    expect(
      documents.map((document) => document.fileName).sort(),
    ).toStrictEqual([
      "10020Records.csv",
      "supermarket_sales - Sheet1.csv",
    ]);
    expect(
      documents.every(
        (document) =>
          document.status === "extracted" &&
          document.rawObject !== undefined &&
          document.checksumSha256 !== undefined,
      ),
    ).toBe(true);
    expect(
      salesDocument &&
        (await storage.exists(salesDocument.rawObject?.key ?? "missing")),
    ).toBe(true);
    expect(
      supermarketDocument &&
        (await storage.exists(supermarketDocument.rawObject?.key ?? "missing")),
    ).toBe(true);
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
    ).toEqual(
      expect.arrayContaining([{ label: "Rows parsed", value: 1000 }]),
    );
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
    const baseStorage = createLocalObjectStorage({ rootDirectory: storageRoot });
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
      storage,
    });
    const secondRequest = ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository,
      factRepository,
      orgId: "org_seed_concurrent",
      storage,
    });

    for (let attempt = 0; attempt < 50 && putObjectCount === 0; attempt += 1) {
      await delay(10);
    }

    expect(putObjectCount).toBe(1);
    releaseBlockedPutObject?.();

    await Promise.all([firstRequest, secondRequest]);

    expect(putObjectCount).toBe(2);
    await expect(
      documentRepository.listByOrgId("org_seed_concurrent"),
    ).resolves.toHaveLength(2);
    await expect(
      factRepository.listByOrgId("org_seed_concurrent"),
    ).resolves.toHaveLength(6);
  });
});
