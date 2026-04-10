import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  type ObjectStorage,
  type PutObjectInput,
  storedObjectSchema,
  type StoredObject,
} from "@/features/storage/lib/object-storage";

type LocalObjectStorageOptions = {
  now?: () => string;
  rootDirectory: string;
};

export function createLocalObjectStorage({
  now = () => new Date().toISOString(),
  rootDirectory,
}: LocalObjectStorageOptions): ObjectStorage {
  const absoluteRootDirectory = path.resolve(rootDirectory);

  return {
    async exists(key) {
      try {
        await access(resolveStoragePath(absoluteRootDirectory, key));
        return true;
      } catch {
        return false;
      }
    },
    async getObject(key) {
      return readFile(resolveStoragePath(absoluteRootDirectory, key));
    },
    async putObject(input) {
      return putObject(absoluteRootDirectory, input, now);
    },
  };
}

async function putObject(
  absoluteRootDirectory: string,
  input: PutObjectInput,
  now: () => string,
): Promise<StoredObject> {
  const storagePath = resolveStoragePath(absoluteRootDirectory, input.key);

  await mkdir(path.dirname(storagePath), { recursive: true });
  await writeFile(storagePath, input.body);

  return storedObjectSchema.parse({
    bucket: "local",
    contentType: input.contentType,
    createdAt: now(),
    key: input.key,
    metadata: input.metadata ?? {},
    sha256: createHash("sha256").update(input.body).digest("hex"),
    sizeBytes: input.body.byteLength,
  });
}

function resolveStoragePath(
  absoluteRootDirectory: string,
  objectKey: string,
): string {
  const resolvedPath = path.resolve(absoluteRootDirectory, objectKey);

  if (
    resolvedPath !== absoluteRootDirectory &&
    !resolvedPath.startsWith(`${absoluteRootDirectory}${path.sep}`)
  ) {
    throw new Error(`Object key resolves outside storage root: ${objectKey}`);
  }

  return resolvedPath;
}
