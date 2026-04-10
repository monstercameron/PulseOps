import { z } from "zod";

import {
  canonicalEntityTypeSchema,
  type CanonicalEntityType,
} from "@/features/entities/domain/canonical-entity";
import { canonicalFactTypeIdSchema } from "@/features/foundation/domain/canonical-facts";
import { supportedDocumentFamilyIdSchema } from "@/features/foundation/domain/document-families";
import { citationSchema } from "@/features/trust/domain/citation";

export const canonicalFactValueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
]);

export const canonicalFactRecordSchema = z.object({
  canonicalFactTypeId: canonicalFactTypeIdSchema,
  citations: z.array(citationSchema).min(1),
  confidenceScore: z.number().finite().min(0).max(1),
  createdAt: z.string().datetime(),
  documentFamily: supportedDocumentFamilyIdSchema,
  documentId: z.string().min(1),
  entityId: z.string().min(1),
  entityType: canonicalEntityTypeSchema,
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  orgId: z.string().min(1),
  sourceFieldKey: z.string().min(1),
  updatedAt: z.string().datetime(),
  value: canonicalFactValueSchema,
  version: z.literal("canonical-fact.v1"),
});

export type CanonicalFactRecord = z.infer<typeof canonicalFactRecordSchema>;

type CreateCanonicalFactRecordInput = {
  canonicalFactTypeId: CanonicalFactRecord["canonicalFactTypeId"];
  citations: CanonicalFactRecord["citations"];
  confidenceScore: number;
  createdAt?: string;
  documentFamily: CanonicalFactRecord["documentFamily"];
  documentId: string;
  entityId: string;
  entityType: CanonicalEntityType;
  label?: string;
  orgId: string;
  sourceFieldKey: string;
  value: CanonicalFactRecord["value"];
};

export function buildCanonicalFactRecordId(
  documentId: string,
  canonicalFactTypeId: CanonicalFactRecord["canonicalFactTypeId"],
  sourceFieldKey: string,
): string {
  return `fact_${sanitizeStableIdSegment(documentId)}_${sanitizeStableIdSegment(canonicalFactTypeId)}_${sanitizeStableIdSegment(sourceFieldKey)}`;
}

export function createCanonicalFactRecord(
  input: CreateCanonicalFactRecordInput,
): CanonicalFactRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return canonicalFactRecordSchema.parse({
    canonicalFactTypeId: input.canonicalFactTypeId,
    citations: input.citations,
    confidenceScore: input.confidenceScore,
    createdAt,
    documentFamily: input.documentFamily,
    documentId: input.documentId,
    entityId: input.entityId,
    entityType: input.entityType,
    id: buildCanonicalFactRecordId(
      input.documentId,
      input.canonicalFactTypeId,
      input.sourceFieldKey,
    ),
    label: input.label,
    orgId: input.orgId,
    sourceFieldKey: input.sourceFieldKey,
    updatedAt: createdAt,
    value: input.value,
    version: "canonical-fact.v1",
  });
}

function sanitizeStableIdSegment(value: string): string {
  const sanitizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitizedValue.length > 0 ? sanitizedValue : "unknown";
}
