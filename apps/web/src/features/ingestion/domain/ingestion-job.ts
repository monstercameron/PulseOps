import { z } from "zod";

export const ingestionJobStatusSchema = z.enum([
  "queued",
  "parsing",
  "classifying",
  "extracting",
  "normalizing",
  "completed",
  "failed",
  "cancelled",
]);

export type IngestionJobStatus = z.infer<typeof ingestionJobStatusSchema>;

export const ingestionJobSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  documentId: z.string().min(1),
  status: ingestionJobStatusSchema,
  attemptCount: z.number().int().positive(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  lastUpdatedAt: z.string().datetime(),
  failureReason: z.string().trim().min(1).optional(),
});

export type IngestionJob = z.infer<typeof ingestionJobSchema>;

const allowedTransitions: Record<
  IngestionJobStatus,
  readonly IngestionJobStatus[]
> = {
  queued: ["parsing", "failed", "cancelled"],
  parsing: ["classifying", "failed", "cancelled"],
  classifying: ["extracting", "failed", "cancelled"],
  extracting: ["normalizing", "failed", "cancelled"],
  normalizing: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

type CreateIngestionJobInput = Pick<
  IngestionJob,
  "documentId" | "id" | "orgId"
>;

export function createIngestionJob(
  input: CreateIngestionJobInput,
  createdAt = new Date().toISOString(),
): IngestionJob {
  return ingestionJobSchema.parse({
    ...input,
    attemptCount: 1,
    createdAt,
    lastUpdatedAt: createdAt,
    status: "queued",
  });
}

export function canTransitionIngestionJobStatus(
  currentStatus: IngestionJobStatus,
  nextStatus: IngestionJobStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function transitionIngestionJob(
  job: IngestionJob,
  nextStatus: IngestionJobStatus,
  transitionedAt = new Date().toISOString(),
  failureReason?: string,
): IngestionJob {
  if (!canTransitionIngestionJobStatus(job.status, nextStatus)) {
    throw new Error(
      `Invalid ingestion job transition: ${job.status} -> ${nextStatus}`,
    );
  }

  return ingestionJobSchema.parse({
    ...job,
    status: nextStatus,
    startedAt:
      job.startedAt ?? (nextStatus === "queued" ? undefined : transitionedAt),
    completedAt:
      nextStatus === "completed" ||
      nextStatus === "failed" ||
      nextStatus === "cancelled"
        ? transitionedAt
        : undefined,
    failureReason:
      nextStatus === "failed"
        ? (failureReason ?? "Unknown failure")
        : undefined,
    lastUpdatedAt: transitionedAt,
  });
}
