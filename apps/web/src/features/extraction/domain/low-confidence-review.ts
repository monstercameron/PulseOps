import { z } from "zod";

import {
  extractionContractSchema,
  type ExtractionContract,
} from "@/features/extraction/domain/extraction-contract";
import {
  parserArtifactSchema,
  type ParserArtifact,
} from "@/features/parsing/domain/parser-artifact";

export const lowConfidenceReviewReasonSchema = z.enum([
  "low_parser_confidence",
  "low_classification_confidence",
  "low_field_confidence",
  "missing_fact_backed_fields",
]);

export const lowConfidenceReviewSchema = z.object({
  classificationConfidenceScore: z.number().finite().min(0).max(1),
  documentId: z.string().min(1),
  fieldKeysNeedingReview: z.array(z.string().min(1)),
  parserConfidenceScore: z.number().finite().min(0).max(1),
  reasonCodes: z.array(lowConfidenceReviewReasonSchema).min(1),
  reviewSeverity: z.enum(["medium", "high"]),
});

export type LowConfidenceReview = z.infer<typeof lowConfidenceReviewSchema>;

type BuildLowConfidenceReviewInput = {
  classificationConfidenceScore: number;
  extractionContract: ExtractionContract;
  parserArtifact: ParserArtifact;
};

export function buildLowConfidenceReview(
  input: BuildLowConfidenceReviewInput,
): LowConfidenceReview | null {
  const extractionContract = extractionContractSchema.parse(
    input.extractionContract,
  );
  const parserArtifact = parserArtifactSchema.parse(input.parserArtifact);
  const reasonCodes = new Set<
    z.infer<typeof lowConfidenceReviewReasonSchema>
  >();
  const fieldKeysNeedingReview = extractionContract.fields
    .filter((field) => field.confidenceScore < 0.7)
    .map((field) => field.key);

  if (parserArtifact.confidenceScore < 0.75) {
    reasonCodes.add("low_parser_confidence");
  }

  if (input.classificationConfidenceScore < 0.75) {
    reasonCodes.add("low_classification_confidence");
  }

  if (fieldKeysNeedingReview.length > 0) {
    reasonCodes.add("low_field_confidence");
  }

  if (
    extractionContract.fields.every(
      (field) => field.canonicalFactTypeId === undefined,
    )
  ) {
    reasonCodes.add("missing_fact_backed_fields");
  }

  if (reasonCodes.size === 0) {
    return null;
  }

  const reviewSeverity =
    reasonCodes.has("low_parser_confidence") ||
    reasonCodes.has("missing_fact_backed_fields")
      ? "high"
      : "medium";

  return lowConfidenceReviewSchema.parse({
    classificationConfidenceScore: input.classificationConfidenceScore,
    documentId: extractionContract.documentId,
    fieldKeysNeedingReview,
    parserConfidenceScore: parserArtifact.confidenceScore,
    reasonCodes: Array.from(reasonCodes),
    reviewSeverity,
  });
}
