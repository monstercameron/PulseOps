import { z } from "zod";

import { supportedDocumentFamilyIdSchema } from "@/features/foundation/domain/document-families";

const citationLocatorValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export const citationLocatorTypeSchema = z.enum([
  "cell",
  "row",
  "sheet",
  "page",
  "line-range",
  "table",
  "field",
  "object-path",
]);

export const confidenceBandSchema = z.enum(["low", "medium", "high"]);

export type ConfidenceBand = z.infer<typeof confidenceBandSchema>;

export const citationSchema = z.object({
  version: z.literal("citation.v1"),
  documentFamily: supportedDocumentFamilyIdSchema,
  documentId: z.string().min(1),
  locator: z.record(z.string(), citationLocatorValueSchema),
  locatorType: citationLocatorTypeSchema,
  sourceHash: z.string().min(1),
  confidenceBand: confidenceBandSchema,
  confidenceScore: z.number().finite().min(0).max(1),
  excerpt: z.string().trim().min(1).max(400).optional(),
  capturedAt: z.string().datetime(),
});

export type Citation = z.infer<typeof citationSchema>;

export function confidenceBandFromScore(score: number): ConfidenceBand {
  citationSchema.shape.confidenceScore.parse(score);

  if (score >= 0.85) {
    return "high";
  }

  if (score >= 0.6) {
    return "medium";
  }

  return "low";
}

type CreateCitationInput = Omit<
  Citation,
  "capturedAt" | "confidenceBand" | "version"
> & {
  capturedAt?: string;
};

export function createCitation(input: CreateCitationInput): Citation {
  const capturedAt = input.capturedAt ?? new Date().toISOString();

  return citationSchema.parse({
    ...input,
    capturedAt,
    confidenceBand: confidenceBandFromScore(input.confidenceScore),
    version: "citation.v1",
  });
}
