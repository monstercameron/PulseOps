import { randomUUID } from "node:crypto";

import { z } from "zod";

import { type ChunkRepository } from "@/features/chunks/repositories/chunk-repository";
import { type TextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";
import { composeDatasetAnswer } from "@/features/query/services/answer-composer";
import { retrieveFactVectorEvidence } from "@/features/query/services/fact-vector-retrieval";
import { planDatasetQuestion } from "@/features/query/services/query-planner";
import { saveQuestion } from "@/features/query/services/save-question";
import { selectAskWidget } from "@/features/ask/lib/ask-widget-selector";

const askRequestSchema = z.object({
  orgId: z.string().min(1),
  question: z.string().min(1),
  saveQuestion: z.boolean().optional(),
});

type AskRequestDependencies = {
  chunkRepository: ChunkRepository;
  embedder: TextEmbedder;
  factRepository: FactRepository;
  generateId?: () => string;
  savedQuestionRepository: SavedQuestionRepository;
};

export async function handleAskRequest(
  request: Request,
  dependencies: AskRequestDependencies,
): Promise<Response> {
  const payload = askRequestSchema.parse(await request.json());
  const plan = planDatasetQuestion(payload.question, payload.orgId);
  const retrieval = await retrieveFactVectorEvidence({
    chunkRepository: dependencies.chunkRepository,
    embedder: dependencies.embedder,
    factRepository: dependencies.factRepository,
    plan,
  });
  const answer = composeDatasetAnswer(plan, retrieval);
  const widget = selectAskWidget(plan, retrieval);

  if (payload.saveQuestion === true) {
    await saveQuestion({
      id: (dependencies.generateId ?? randomUUID)(),
      orgId: payload.orgId,
      question: payload.question,
      queryPlan: plan,
      repository: dependencies.savedQuestionRepository,
    });
  }

  return Response.json({
    answer,
    plan,
    widget,
  });
}
