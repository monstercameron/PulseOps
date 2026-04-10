import {
  createSavedQuestion,
  type SavedQuestion,
} from "@/features/query/domain/saved-question";
import { type QueryPlan } from "@/features/query/domain/query-plan";
import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";

type SaveQuestionInput = {
  createdAt?: string;
  id: string;
  orgId: string;
  question: string;
  queryPlan: QueryPlan;
  repository: SavedQuestionRepository;
};

export async function saveQuestion({
  createdAt,
  id,
  orgId,
  question,
  queryPlan,
  repository,
}: SaveQuestionInput): Promise<SavedQuestion> {
  const savedQuestion = createSavedQuestion({
    createdAt,
    id,
    orgId,
    question,
    queryPlan,
  });

  await repository.put(savedQuestion);

  return savedQuestion;
}
