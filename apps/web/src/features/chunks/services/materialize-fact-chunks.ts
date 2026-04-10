import { buildFactChunkDrafts } from "@/features/chunks/domain/fact-chunking";
import {
  createRetrievalChunk,
  type RetrievalChunk,
} from "@/features/chunks/domain/retrieval-chunk";
import { type ChunkRepository } from "@/features/chunks/repositories/chunk-repository";
import { type TextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { type EntityRepository } from "@/features/entities/repositories/entity-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";

export type MaterializedFactChunks = {
  chunkCount: number;
  chunks: RetrievalChunk[];
};

type MaterializeFactChunksInput = {
  chunkRepository: ChunkRepository;
  documentId: string;
  embedder: TextEmbedder;
  entityRepository: EntityRepository;
  factRepository: FactRepository;
  now?: () => string;
  orgId: string;
};

export async function materializeFactChunks({
  chunkRepository,
  documentId,
  embedder,
  entityRepository,
  factRepository,
  now = () => new Date().toISOString(),
  orgId,
}: MaterializeFactChunksInput): Promise<MaterializedFactChunks> {
  const facts = await factRepository.listByDocumentId(documentId);
  const entities = (
    await Promise.all(
      Array.from(new Set(facts.map((fact) => fact.entityId))).map((entityId) =>
        entityRepository.getById(entityId),
      ),
    )
  ).filter((entity) => entity !== null);
  const chunkDrafts = buildFactChunkDrafts({
    entities,
    facts: facts.filter((fact) => fact.orgId === orgId),
  });
  const createdAt = now();
  const chunks: RetrievalChunk[] = [];

  for (const draft of chunkDrafts) {
    const chunk = createRetrievalChunk({
      canonicalFactTypeIds: draft.canonicalFactTypeIds,
      citations: draft.citations,
      content: draft.content,
      createdAt,
      documentId: draft.documentId,
      embedding: embedder.embedText(draft.content),
      embeddingModel: embedder.modelId,
      entityId: draft.entityId,
      entityType: draft.entityType,
      orgId: draft.orgId,
    });

    chunks.push(chunk);
    await chunkRepository.put(chunk);
  }

  return {
    chunkCount: chunks.length,
    chunks,
  };
}
