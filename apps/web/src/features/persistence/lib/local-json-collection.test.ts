import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("createLocalJsonCollection", () => {
  it("persists and reloads validated records by id", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-collection-"),
    );
    temporaryDirectories.push(rootDirectory);

    const collection = createLocalJsonCollection({
      filePath: path.join(rootDirectory, "documents.json"),
      recordSchema: z.object({
        id: z.string().min(1),
        value: z.string().min(1),
      }),
    });

    await collection.put({
      id: "doc_123",
      value: "alpha",
    });
    await collection.put({
      id: "doc_123",
      value: "beta",
    });

    expect(await collection.getById("doc_123")).toEqual({
      id: "doc_123",
      value: "beta",
    });
    expect(await collection.list()).toEqual([
      {
        id: "doc_123",
        value: "beta",
      },
    ]);
  });
});
