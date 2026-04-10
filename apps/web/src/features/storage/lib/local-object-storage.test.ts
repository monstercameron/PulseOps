import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildObjectStorageKey,
  sanitizeObjectKeySegment,
} from "@/features/storage/lib/object-storage";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("local object storage", () => {
  it("builds stable sanitized object keys", () => {
    expect(
      buildObjectStorageKey({
        createdAt: "2026-04-09T16:00:00.000Z",
        documentId: "doc_123",
        fileName: "Invoice Export April 2026.csv",
        orgId: "Org Alpha",
      }),
    ).toBe(
      "orgs/org-alpha/documents/doc_123/2026/04/invoice-export-april-2026.csv",
    );
    expect(sanitizeObjectKeySegment("   ???   ")).toBe("unnamed");
  });

  it("writes and reads stored objects", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-storage-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T16:00:00.000Z",
      rootDirectory,
    });

    const storedObject = await storage.putObject({
      body: Buffer.from("invoice_id,amount_due\nINV-001,4200", "utf8"),
      contentType: "text/csv",
      key: "orgs/org-1/documents/doc-1/2026/04/invoices.csv",
      metadata: {
        documentId: "doc-1",
        orgId: "org-1",
      },
    });

    expect(storedObject.sizeBytes).toBeGreaterThan(0);
    expect(await storage.exists(storedObject.key)).toBe(true);
    expect(
      (await storage.getObject(storedObject.key)).toString("utf8"),
    ).toContain("INV-001");
  });
});
