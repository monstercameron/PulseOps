import { z } from "zod";

const packMetricSchema = z.object({
  detail: z.string().min(1),
  label: z.string().min(1),
  tone: z.enum(["danger", "info", "success", "warning"]),
  value: z.string().min(1),
});

const packRecommendationSchema = z.object({
  actions: z.array(z.string().min(1)).readonly(),
  citations: z.array(z.string().min(1)).readonly(),
  confidence: z.number().min(0).max(1),
  id: z.string().min(1),
  priority: z.enum(["danger", "info", "success", "warning"]),
  priorityLabel: z.string().min(1),
  summary: z.string().min(1),
  title: z.string().min(1),
});

const packSourceRecordSchema = z.object({
  classLabel: z.string().min(1),
  confidenceLabel: z.string().min(1),
  contributionLabel: z.string().min(1),
  id: z.string().min(1),
  name: z.string().min(1),
});

export const packRecordSchema = z.object({
  accent: z.enum(["accent", "info", "warning"]),
  generatedAtLabel: z.string().min(1),
  id: z.string().min(1),
  meta: z.array(z.string().min(1)).readonly(),
  metrics: z.array(packMetricSchema).readonly(),
  orgId: z.string().min(1),
  recommendations: z.array(packRecommendationSchema).readonly(),
  reviewedAt: z.string().datetime().optional(),
  sourceData: z.array(packSourceRecordSchema).readonly(),
  statusLabel: z.string().min(1),
  statusTone: z.enum(["success", "warning"]),
  title: z.string().min(1),
  updatedAt: z.string().datetime(),
  version: z.literal("pack-record.v1"),
});

export type PackRecord = z.infer<typeof packRecordSchema>;

type CreatePackRecordInput = Omit<PackRecord, "updatedAt" | "version"> & {
  updatedAt?: string;
};

export function createPackRecord(input: CreatePackRecordInput): PackRecord {
  return packRecordSchema.parse({
    ...input,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    version: "pack-record.v1",
  });
}
