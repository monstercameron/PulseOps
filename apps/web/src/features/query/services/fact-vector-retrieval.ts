import {
  cosineSimilarity,
  type TextEmbedder,
} from "@/features/chunks/lib/deterministic-embedder";
import { type ChunkRepository } from "@/features/chunks/repositories/chunk-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { type QueryPlan } from "@/features/query/domain/query-plan";

export type FactVectorRetrievalResult = {
  chunks: {
    chunkId: string;
    citations: Awaited<
      ReturnType<ChunkRepository["listByOrgId"]>
    >[number]["citations"];
    content: string;
    score: number;
  }[];
  facts: {
    citations: Awaited<
      ReturnType<FactRepository["listByOrgId"]>
    >[number]["citations"];
    factId: string;
    factTypeId: Awaited<
      ReturnType<FactRepository["listByOrgId"]>
    >[number]["canonicalFactTypeId"];
    score: number;
    value: Awaited<ReturnType<FactRepository["listByOrgId"]>>[number]["value"];
  }[];
};

type RetrieveFactVectorEvidenceInput = {
  chunkRepository: ChunkRepository;
  embedder: TextEmbedder;
  factRepository: FactRepository;
  plan: QueryPlan;
};

export async function retrieveFactVectorEvidence({
  chunkRepository,
  embedder,
  factRepository,
  plan,
}: RetrieveFactVectorEvidenceInput): Promise<FactVectorRetrievalResult> {
  const allFacts = await factRepository.listByOrgId(plan.orgId);
  const allChunks = await chunkRepository.listByOrgId(plan.orgId);
  const facts =
    plan.retrievalMode === "vectors" || plan.retrievalMode === "clarify"
      ? []
      : allFacts
          .filter((fact) =>
            plan.canonicalFactTypeIds.includes(fact.canonicalFactTypeId),
          )
          .sort((left, right) => {
            if (right.confidenceScore !== left.confidenceScore) {
              return right.confidenceScore - left.confidenceScore;
            }

            return left.id.localeCompare(right.id);
          })
          .slice(0, plan.limit)
          .map((fact) => ({
            citations: fact.citations,
            factId: fact.id,
            factTypeId: fact.canonicalFactTypeId,
            score: fact.confidenceScore,
            value: fact.value,
          }));
  const chunks =
    plan.retrievalMode === "facts" || plan.retrievalMode === "clarify"
      ? []
      : (() => {
          const queryVector = embedder.embedText(
            plan.vectorSearchText ?? plan.question,
          );

          return allChunks
            .map((chunk) => ({
              chunkId: chunk.id,
              citations: chunk.citations,
              content: chunk.content,
              score: cosineSimilarity(queryVector, chunk.embedding),
            }))
            .sort((left, right) => {
              if (right.score !== left.score) {
                return right.score - left.score;
              }

              return left.chunkId.localeCompare(right.chunkId);
            })
            .slice(0, plan.limit);
        })();

  return {
    chunks,
    facts,
  };
}
