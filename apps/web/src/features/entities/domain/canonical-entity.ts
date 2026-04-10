import { z } from "zod";

export const canonicalEntityTypeSchema = z.enum([
  "invoice",
  "vendor_bill",
  "bank_transaction",
  "job",
  "estimate",
  "work_order",
  "crew",
  "payment",
  "document",
]);

export type CanonicalEntityType = z.infer<typeof canonicalEntityTypeSchema>;

export const canonicalEntitySchema = z.object({
  aliases: z.array(z.string().min(1)),
  canonicalKey: z.string().min(1),
  createdAt: z.string().datetime(),
  displayName: z.string().min(1),
  entityType: canonicalEntityTypeSchema,
  id: z.string().min(1),
  orgId: z.string().min(1),
  sourceDocumentIds: z.array(z.string().min(1)).min(1),
  updatedAt: z.string().datetime(),
  version: z.literal("canonical-entity.v1"),
});

export type CanonicalEntity = z.infer<typeof canonicalEntitySchema>;

type CreateCanonicalEntityInput = {
  aliases?: string[];
  canonicalKey: string;
  createdAt?: string;
  displayName: string;
  entityType: CanonicalEntityType;
  orgId: string;
  sourceDocumentId: string;
};

type MergeCanonicalEntityInput = {
  aliases?: string[];
  displayName?: string;
  sourceDocumentId: string;
  updatedAt?: string;
};

export function buildCanonicalEntityId(
  entityType: CanonicalEntityType,
  orgId: string,
  canonicalKey: string,
): string {
  return `entity_${sanitizeStableIdSegment(orgId)}_${entityType}_${sanitizeStableIdSegment(canonicalKey)}`;
}

export function createCanonicalEntity(
  input: CreateCanonicalEntityInput,
): CanonicalEntity {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return canonicalEntitySchema.parse({
    aliases: dedupeStringValues(input.aliases ?? []),
    canonicalKey: input.canonicalKey,
    createdAt,
    displayName: input.displayName,
    entityType: input.entityType,
    id: buildCanonicalEntityId(
      input.entityType,
      input.orgId,
      input.canonicalKey,
    ),
    orgId: input.orgId,
    sourceDocumentIds: [input.sourceDocumentId],
    updatedAt: createdAt,
    version: "canonical-entity.v1",
  });
}

export function mergeCanonicalEntity(
  entity: CanonicalEntity,
  input: MergeCanonicalEntityInput,
): CanonicalEntity {
  return canonicalEntitySchema.parse({
    ...entity,
    aliases: dedupeStringValues([...entity.aliases, ...(input.aliases ?? [])]),
    displayName: input.displayName ?? entity.displayName,
    sourceDocumentIds: dedupeStringValues([
      ...entity.sourceDocumentIds,
      input.sourceDocumentId,
    ]),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  });
}

function dedupeStringValues(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  );
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
