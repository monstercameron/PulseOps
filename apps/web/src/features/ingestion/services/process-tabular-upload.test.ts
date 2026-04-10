import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";
import {
  ProcessTabularUploadError,
  processTabularUpload,
} from "@/features/ingestion/services/process-tabular-upload";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("processTabularUpload", () => {
  it("stores, parses, classifies, and advances uploads toward extraction", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-ingestion-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T16:00:00.000Z",
      rootDirectory,
    });
    const ids = ["doc_123", "job_123", "artifact_123"];
    const logMessages: string[] = [];
    let tick = 0;

    const result = await processTabularUpload({
      body: Buffer.from(
        "Invoice Number,Customer Name,Due Date,Amount Due\nINV-001,Acme Heating,2026-04-14,4200",
        "utf8",
      ),
      fileName: "customer-invoice-export.csv",
      generateId: () => ids.shift() ?? "extra_id",
      log: (message) => logMessages.push(message),
      now: () => `2026-04-09T16:00:0${tick++}.000Z`,
      orgId: "org_123",
      storage,
    });

    expect(result.storageObject.key).toContain("customer-invoice-export.csv");
    expect(result.document.status).toBe("classified");
    expect(result.document.suggestedDocumentFamily).toBe("customer-invoice");
    expect(result.ingestionJob.status).toBe("extracting");
    expect(result.parserArtifact.parserKind).toBe("csv");
    expect(result.parserArtifact.totalRowCount).toBe(1);
    expect(logMessages).toHaveLength(1);
  });

  it("fails unsupported file extensions with tracked state", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-ingestion-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      rootDirectory,
    });

    await expect(
      processTabularUpload({
        body: Buffer.from("hello world", "utf8"),
        fileName: "notes.txt",
        generateId: (() => {
          const ids = ["doc_123", "job_123", "artifact_123"];

          return () => ids.shift() ?? "extra_id";
        })(),
        now: () => "2026-04-09T16:00:00.000Z",
        orgId: "org_123",
        storage,
      }),
    ).rejects.toBeInstanceOf(ProcessTabularUploadError);

    try {
      await processTabularUpload({
        body: Buffer.from("hello world", "utf8"),
        fileName: "notes.txt",
        generateId: (() => {
          const ids = ["doc_223", "job_223", "artifact_223"];

          return () => ids.shift() ?? "extra_id";
        })(),
        now: () => "2026-04-09T16:00:00.000Z",
        orgId: "org_123",
        storage,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ProcessTabularUploadError);

      const uploadError = error as ProcessTabularUploadError;

      expect(uploadError.document.status).toBe("failed");
      expect(uploadError.ingestionJob.status).toBe("failed");
      expect(uploadError.message).toBe(
        "Unsupported tabular file extension: txt",
      );
    }
  });
});
