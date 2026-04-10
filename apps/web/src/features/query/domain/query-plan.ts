import { z } from "zod";

import { canonicalEntityTypeSchema } from "@/features/entities/domain/canonical-entity";
import { canonicalFactTypeIdSchema } from "@/features/foundation/domain/canonical-facts";

export const retrievalModeSchema = z.enum([
  "facts",
  "vectors",
  "hybrid",
  "clarify",
]);

export const queryPlanSchema = z.object({
  canonicalFactTypeIds: z.array(canonicalFactTypeIdSchema),
  entityTypes: z.array(canonicalEntityTypeSchema),
  limit: z.number().int().positive().max(25),
  needsClarification: z.boolean(),
  orgId: z.string().min(1),
  question: z.string().min(1),
  rationale: z.string().min(1),
  retrievalMode: retrievalModeSchema,
  vectorSearchText: z.string().min(1).optional(),
  version: z.literal("query-plan.v1"),
});

export type QueryPlan = z.infer<typeof queryPlanSchema>;

type CreateQueryPlanInput = Omit<QueryPlan, "version">;

export function createQueryPlan(input: CreateQueryPlanInput): QueryPlan {
  return queryPlanSchema.parse({
    ...input,
    version: "query-plan.v1",
  });
}
