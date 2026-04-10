import { z } from "zod";

import { documentSourceSchema } from "@/features/documents/domain/document";

export const ingestionEventKindSchema = z.enum([
  "upload.queued",
  "upload.duplicate",
]);

export const ingestionEventSchema = z.object({
  archiveAfterDays: z.number().int().positive(),
  checksumSha256: z.string().min(1),
  createdAt: z.string().datetime(),
  deduplicated: z.boolean(),
  documentId: z.string().min(1),
  estimatedIngestCostUsd: z.number().finite().nonnegative(),
  fileName: z.string().min(1),
  id: z.string().min(1),
  jobId: z.string().min(1),
  kind: ingestionEventKindSchema,
  metadata: z.record(z.string(), z.string()),
  orgId: z.string().min(1),
  retentionPolicyKey: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  source: documentSourceSchema,
  version: z.literal("ingestion-event.v1"),
});

export type IngestionEvent = z.infer<typeof ingestionEventSchema>;

export function estimateUploadIngestCostUsd(sizeBytes: number): number {
  const normalizedSizeBytes = z.number().int().nonnegative().parse(sizeBytes);
  const sizeMegabytes = normalizedSizeBytes / (1024 * 1024);
  const estimatedCost = 0.0015 + sizeMegabytes * 0.00075;

  return Number(estimatedCost.toFixed(6));
}

export function createIngestionEvent(
  input: Omit<
    IngestionEvent,
    "createdAt" | "estimatedIngestCostUsd" | "version"
  > & {
    createdAt?: string;
    estimatedIngestCostUsd?: number;
  },
): IngestionEvent {
  return ingestionEventSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    estimatedIngestCostUsd:
      input.estimatedIngestCostUsd ??
      estimateUploadIngestCostUsd(input.sizeBytes),
    version: "ingestion-event.v1",
  });
}
