import path from "node:path";

import {
  savedQuestionSchema,
  type SavedQuestion,
} from "@/features/query/domain/saved-question";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";

type LocalSavedQuestionRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalSavedQuestionRepository({
  rootDirectory,
}: LocalSavedQuestionRepositoryOptions): SavedQuestionRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "saved-questions.json"),
    recordSchema: savedQuestionSchema,
  });

  return {
    async deleteById(id) {
      return collection.deleteById(id);
    },
    async getById(id) {
      return collection.getById(id);
    },
    async listByOrgId(orgId) {
      const savedQuestions = await collection.list();

      return savedQuestions.filter(
        (savedQuestion) => savedQuestion.orgId === orgId,
      );
    },
    async put(savedQuestion) {
      return collection.put(savedQuestionSchema.parse(savedQuestion));
    },
  };
}

export type { SavedQuestion };
