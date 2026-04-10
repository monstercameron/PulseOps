import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createIngestionEvent } from "@/features/ingestion/domain/ingestion-event";
import { createLocalIngestionEventRepository } from "@/features/ingestion/repositories/local-ingestion-event-repository";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("local ingestion event repository", () => {
  it("persists upload events by org and document", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-ingestion-events-"),
    );
    temporaryDirectories.push(rootDirectory);

    const repository = createLocalIngestionEventRepository({ rootDirectory });

    await repository.put(
      createIngestionEvent({
        archiveAfterDays: 30,
        checksumSha256: "sha256:abc123",
        deduplicated: false,
        documentId: "doc_123",
        fileName: "invoices.csv",
        id: "event_123",
        jobId: "job_123",
        kind: "upload.queued",
        metadata: {},
        orgId: "org_123",
        retentionPolicyKey: "manual-upload-hot-30d",
        sizeBytes: 1024,
        source: "upload",
      }),
    );

    await expect(repository.listByOrgId("org_123")).resolves.toHaveLength(1);
    await expect(repository.listByDocumentId("doc_123")).resolves.toHaveLength(
      1,
    );
  });
});
