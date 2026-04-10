import { z } from "zod";

export const processingPolicyScopeKindSchema = z.enum([
  "tenant-default",
  "source",
  "document-family",
]);

export const processingPolicyParserRouteSchema = z.enum(["tabular", "text"]);

export const processingPolicySchema = z.object({
  createdAt: z.string().datetime(),
  embeddingsEnabled: z.boolean(),
  extractionEnabled: z.boolean(),
  humanReviewRequired: z.boolean(),
  id: z.string().min(1),
  name: z.string().min(1),
  orgId: z.string().min(1),
  parserRoute: processingPolicyParserRouteSchema,
  redactionPolicyKey: z.string().min(1),
  retentionPolicyKey: z.string().min(1),
  scopeKey: z.string().min(1),
  scopeKind: processingPolicyScopeKindSchema,
  updatedAt: z.string().datetime(),
  version: z.literal("processing-policy.v1"),
});

export type ProcessingPolicy = z.infer<typeof processingPolicySchema>;

type CreateProcessingPolicyInput = Omit<
  ProcessingPolicy,
  "createdAt" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createProcessingPolicy(
  input: CreateProcessingPolicyInput,
): ProcessingPolicy {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return processingPolicySchema.parse({
    ...input,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: "processing-policy.v1",
  });
}
