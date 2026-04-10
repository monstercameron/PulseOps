import path from "node:path";

import { z } from "zod";

export const storedObjectSchema = z.object({
  bucket: z.literal("local"),
  contentType: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  key: z.string().min(1),
  metadata: z.record(z.string(), z.string()),
  sha256: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export type StoredObject = z.infer<typeof storedObjectSchema>;

export type PutObjectInput = {
  body: Buffer;
  contentType?: string;
  key: string;
  metadata?: Record<string, string>;
};

export interface ObjectStorage {
  exists(key: string): Promise<boolean>;
  getObject(key: string): Promise<Buffer>;
  putObject(input: PutObjectInput): Promise<StoredObject>;
}

type BuildObjectStorageKeyInput = {
  createdAt: string;
  documentId: string;
  fileName: string;
  orgId: string;
};

export function buildObjectStorageKey({
  createdAt,
  documentId,
  fileName,
  orgId,
}: BuildObjectStorageKeyInput): string {
  const createdDate = new Date(createdAt);
  const year = String(createdDate.getUTCFullYear());
  const month = String(createdDate.getUTCMonth() + 1).padStart(2, "0");
  const safeFileName = sanitizeObjectKeySegment(fileName);

  return path.posix.join(
    "orgs",
    sanitizeObjectKeySegment(orgId),
    "documents",
    sanitizeObjectKeySegment(documentId),
    year,
    month,
    safeFileName,
  );
}

export function sanitizeObjectKeySegment(value: string): string {
  const trimmedValue = value.trim().toLowerCase();
  const sanitizedValue = trimmedValue
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitizedValue.length > 0 ? sanitizedValue : "unnamed";
}
