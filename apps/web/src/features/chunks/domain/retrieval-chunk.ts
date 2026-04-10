import { z } from "zod";

import {
  canonicalEntityTypeSchema,
  type CanonicalEntityType,
} from "@/features/entities/domain/canonical-entity";
import { canonicalFactTypeIdSchema } from "@/features/foundation/domain/canonical-facts";
import { citationSchema } from "@/features/trust/domain/citation";

export const retrievalChunkSourceKindSchema = z.enum(["fact-entity-summary"]);

export const retrievalChunkSchema = z.object({
  canonicalFactTypeIds: z.array(canonicalFactTypeIdSchema).min(1),
  citations: z.array(citationSchema).min(1),
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  documentId: z.string().min(1),
  embedding: z.array(z.number().finite()).min(1),
  embeddingDimensions: z.number().int().positive(),
  embeddingModel: z.string().min(1),
  entityId: z.string().min(1),
  entityType: canonicalEntityTypeSchema,
  id: z.string().min(1),
  orgId: z.string().min(1),
  sourceKind: retrievalChunkSourceKindSchema,
  updatedAt: z.string().datetime(),
  version: z.literal("retrieval-chunk.v1"),
});

export type RetrievalChunk = z.infer<typeof retrievalChunkSchema>;

type CreateRetrievalChunkInput = {
  canonicalFactTypeIds: RetrievalChunk["canonicalFactTypeIds"];
  citations: RetrievalChunk["citations"];
  content: string;
  createdAt?: string;
  documentId: string;
  embedding: number[];
  embeddingModel: string;
  entityId: string;
  entityType: CanonicalEntityType;
  orgId: string;
  sourceKind?: z.infer<typeof retrievalChunkSourceKindSchema>;
};

export function buildRetrievalChunkId(
  documentId: string,
  entityId: string,
  sourceKind = "fact-entity-summary",
): string {
  return `chunk_${sanitizeStableIdSegment(documentId)}_${sanitizeStableIdSegment(entityId)}_${sanitizeStableIdSegment(sourceKind)}`;
}

export function createRetrievalChunk(
  input: CreateRetrievalChunkInput,
): RetrievalChunk {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const sourceKind = input.sourceKind ?? "fact-entity-summary";

  return retrievalChunkSchema.parse({
    canonicalFactTypeIds: input.canonicalFactTypeIds,
    citations: input.citations,
    content: input.content,
    createdAt,
    documentId: input.documentId,
    embedding: input.embedding,
    embeddingDimensions: input.embedding.length,
    embeddingModel: input.embeddingModel,
    entityId: input.entityId,
    entityType: input.entityType,
    id: buildRetrievalChunkId(input.documentId, input.entityId, sourceKind),
    orgId: input.orgId,
    sourceKind,
    updatedAt: createdAt,
    version: "retrieval-chunk.v1",
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
