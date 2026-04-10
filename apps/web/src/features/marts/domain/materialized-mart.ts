import { z } from "zod";

export const materializedMartSchema = z.object({
  asOfDate: z.string().date(),
  createdAt: z.string().datetime(),
  dimensionValues: z.record(z.string(), z.string()),
  id: z.string().min(1),
  metricId: z.string().min(1),
  orgId: z.string().min(1),
  supportingFactIds: z.array(z.string().min(1)),
  value: z.number().finite(),
  version: z.literal("materialized-mart.v1"),
});

export type MaterializedMart = z.infer<typeof materializedMartSchema>;

type CreateMaterializedMartInput = Omit<
  MaterializedMart,
  "createdAt" | "id" | "version"
> & {
  createdAt?: string;
};

export function createMaterializedMart(
  input: CreateMaterializedMartInput,
): MaterializedMart {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return materializedMartSchema.parse({
    ...input,
    createdAt,
    id: `mart_${input.orgId}_${input.metricId}_${input.asOfDate}`,
    version: "materialized-mart.v1",
  });
}
