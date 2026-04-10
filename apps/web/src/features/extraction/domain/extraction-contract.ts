import { z } from "zod";

import { canonicalFactTypeIdSchema } from "@/features/foundation/domain/canonical-facts";
import { supportedDocumentFamilyIdSchema } from "@/features/foundation/domain/document-families";
import { citationSchema } from "@/features/trust/domain/citation";

const extractionFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
]);

export const extractedFieldSchema = z.object({
  canonicalFactTypeId: canonicalFactTypeIdSchema.optional(),
  citations: z.array(citationSchema).min(1),
  confidenceScore: z.number().finite().min(0).max(1),
  key: z.string().min(1),
  label: z.string().min(1),
  value: extractionFieldValueSchema,
});

export const extractionContractSchema = z.object({
  createdAt: z.string().datetime(),
  documentFamily: supportedDocumentFamilyIdSchema,
  documentId: z.string().min(1),
  fields: z.array(extractedFieldSchema),
  requiresHumanReview: z.boolean(),
  version: z.literal("extraction.v1"),
});

export type ExtractionContract = z.infer<typeof extractionContractSchema>;

type CreateExtractionContractInput = Omit<
  ExtractionContract,
  "createdAt" | "requiresHumanReview" | "version"
> & {
  createdAt?: string;
};

export function createExtractionContract(
  input: CreateExtractionContractInput,
): ExtractionContract {
  return extractionContractSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    requiresHumanReview: input.fields.some(
      (field) => field.confidenceScore < 0.7,
    ),
    version: "extraction.v1",
  });
}

export function summarizeExtractionContract(contract: ExtractionContract) {
  const factBackedFieldCount = contract.fields.filter(
    (field) => field.canonicalFactTypeId !== undefined,
  ).length;

  return {
    documentFamily: contract.documentFamily,
    fieldCount: contract.fields.length,
    factBackedFieldCount,
    requiresHumanReview: contract.requiresHumanReview,
  };
}
