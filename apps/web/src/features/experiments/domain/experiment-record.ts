import { z } from "zod";

export const experimentStatusSchema = z.enum([
  "draft",
  "running",
  "completed",
  "archived",
]);

export const experimentRecordSchema = z.object({
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  hypothesis: z.string().min(1),
  id: z.string().min(1),
  orgId: z.string().min(1),
  primaryMetric: z.string().min(1),
  promptFamily: z.string().min(1),
  startedAt: z.string().datetime().optional(),
  status: experimentStatusSchema,
  updatedAt: z.string().datetime(),
  variantId: z.string().min(1),
  version: z.literal("experiment-record.v1"),
});

export type ExperimentRecord = z.infer<typeof experimentRecordSchema>;

type CreateExperimentRecordInput = Omit<
  ExperimentRecord,
  "createdAt" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createExperimentRecord(
  input: CreateExperimentRecordInput,
): ExperimentRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return experimentRecordSchema.parse({
    ...input,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: "experiment-record.v1",
  });
}
